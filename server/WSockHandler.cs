using System.Collections.Concurrent;
using System.Collections.Specialized;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;

record struct ReceivedMsg(Player p, Msg msg);

static class WSockHandler
{
  public static HttpListener? httpListener;
  public static BlockingCollection<ReceivedMsg>? preGameQ;  // reference to preGameQ in Program.cs

  public static bool continueProcessing = true;

  public static async Task AcceptConnections()
  {
    if (httpListener == null)
      return;

    while (httpListener.IsListening && continueProcessing)
    {
      var hc = await httpListener.GetContextAsync();
      if (!hc.Request.IsWebSocketRequest)
      {
        hc.Response.StatusCode = 400;
        hc.Response.Close();
        return;
      }

      var ws = await hc.AcceptWebSocketAsync(null).ConfigureAwait(false);
      if (ws != null)
      {
        _ = Task.Run(() => HandleConnectionAsync(ws.WebSocket, hc.Request.QueryString, hc.Request.Headers["X-Remote-IP"]??"?"));
      }
    }
  }

  static async Task HandleConnectionAsync(WebSocket ws, NameValueCollection qs, string ip)
  {
    Player? p = null;
    Console.WriteLine($"New connection from {ip} {qs["game"]} {qs["color"]}");

    try
    {
      p = Game.GetInactivePlayer(qs["game"], qs["color"]);
      if (p == null)
        p = new Player();

      p.ws = ws;
      p.ip = ip;

      if (p.RejoinStartedGame()) {}
      else if (p.JoinUnstartedGame(qs["game"], out string _)) {}
      else
        p.send(new AvailableGames());

      while (ws.State == WebSocketState.Open)
      {
        Msg msg = await GetMsg(ws);

        if (msg == SockCloseMsg) break;

        if (p.game == null && preGameQ != null)
          preGameQ.Add(new ReceivedMsg(p, msg));
        else if (p.game != null)
          await p.game.channel.Writer.WriteAsync(new ReceivedMsg(p, msg));
      }

      p.ws = null;
      Console.WriteLine($"Connection closed normally...");
      await ws.CloseAsync(WebSocketCloseStatus.NormalClosure, "Done", CancellationToken.None);
    }
    catch (Exception e)
    {
      if (p != null) p.ws = null;
      Console.WriteLine($"Exception - close websocket... {e.StackTrace}");

      try
      {
        await ws.CloseAsync(WebSocketCloseStatus.InternalServerError, "Done", CancellationToken.None).ConfigureAwait(false);
      }
      catch { }
    }
    finally
    {
      ws.Dispose();
    }
  }

  static readonly Dictionary<string, Type> msgTypes = DetermineMsgTypes();

  static Dictionary<string, Type> DetermineMsgTypes()
  {
    Dictionary<string, Type> d = new();
    Type MsgType = typeof(Msg);

    foreach (var msgSubInfo in MsgType.Assembly.DefinedTypes)
    {
      if (MsgType.IsAssignableFrom(msgSubInfo))
        d[msgSubInfo.Name] = msgSubInfo.AsType();
    }

    return d;
  }

  static readonly byte[] mtMarker = Encoding.UTF8.GetBytes("_mt");

  static Type GetTypeForMsg(byte[] buf)
  {
    // probably stream starts with '{"_mt":"'
    if (BitConverter.ToInt64(buf) == 0x223A22746D5F227B)
    {
      int i = 8;
      while (buf[i] != '"') i++;
      string mt = Encoding.UTF8.GetString(buf, 8, i - 8);
      return msgTypes[mt];
    }

    // otherwise assume only one _mt in json stream
    Utf8JsonReader r = new(buf);
    while (r.Read())
    {
      if (r.TokenType == JsonTokenType.PropertyName && r.ValueTextEquals(mtMarker))
      {
        r.Read();
        string? t = r.GetString();
        if (t == null) throw new Exception("Couldn't get string for _mt property");
        return msgTypes[t];
      }
    }

    throw new Exception("Couldn't find _mt element");
  }

  static Msg GetMsg(byte[] buf, int len, Type t)
  {
    var o = JsonSerializer.Deserialize(buf.AsSpan(0, len), t);
    if (o == null) throw new Exception("Couldn't deserialize");
    Msg? msg = o as Msg;
    if (msg == null) throw new Exception("Not a Msg type");
    return msg;
  }

  static Msg SockCloseMsg = new();

  static async Task<Msg> GetMsg(WebSocket ws)
  {
    var buf = new byte[1000];
    var read = await ws.ReceiveAsync(buf, CancellationToken.None);
    int len = read.Count;
    while (!read.EndOfMessage)  // rather unlikely for our messages, but still possible...
    {
      int start = len;
      var extra = new byte[1000];
      read = await ws.ReceiveAsync(extra, CancellationToken.None);
      len += read.Count;
      if (buf.Length < len)
       Array.Resize(ref buf, len); 
      Array.Copy(extra, 0, buf, start, read.Count);
    }

    if (len == 0) return SockCloseMsg;
    
    var t = GetTypeForMsg(buf);
    return GetMsg(buf, len, t);
  }

  /*
  static async Task<string> ReadString(WebSocket ws)
  {
    var buf = new Byte[1000];
    var read = await ws.ReceiveAsync(buf, CancellationToken.None);
    string retStr = Encoding.UTF8.GetString(buf, 0, read.Count);
    while (!read.EndOfMessage)
    {
        read = await ws.ReceiveAsync(buf, CancellationToken.None);
        retStr += Encoding.UTF8.GetString(buf, 0, read.Count);
    }

    return retStr;
  }
  */
}

