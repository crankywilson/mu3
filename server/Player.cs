
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]  // use string for JSON Serialization
public enum PlayerColor { R, Y, G, B, NONE, COLONY }  // COLONY is a hack for the asteroid event
public enum ResourceType { FOOD, ENERGY, SMITHORE, CRYSTITE }

public class Dest
{
  [JsonInclude] public double x = 0.0;
  [JsonInclude] public double z = 0.0;
  [JsonInclude] public double spd = 0.0;
  public Dest(double x, double z, double spd) { this.x=x; this.z=z; this.spd=spd; }
}

public class MuleData
{
  [JsonInclude] public int     resOutfit = -1;
  [JsonInclude] public double  x         = 0.0;
  [JsonInclude] public double  z         = 0.0;
  [JsonInclude] public Dest?   dest      = null;
  public MuleData(int r, Player p) { resOutfit = r; x = p.x; z=p.z; }
  public MuleData() {}
}

#pragma warning disable CS0660
#pragma warning disable CS0661

public class Player
{
  [JsonInclude] public string       name    = "";
  [JsonInclude] public string       ip      = "?";
  [JsonInclude] public int          money   = 1000;
  [JsonInclude] public int[]        res     = new[]{ 5, 2, 0, 0, 0 };
  [JsonInclude] public PlayerColor  color   = PlayerColor.NONE;
  [JsonInclude] public bool         isBot   = false;
  [JsonInclude] public PlayerColor  colrReq = PlayerColor.NONE;
  [JsonInclude] public int          score   = 1500;

  [JsonInclude] public double       x       = 0.0;
  [JsonInclude] public double       z       = 0.0;
  [JsonInclude] public Dest?        dest    = null;
  [JsonInclude] public MuleData?    mule    = null;

  [JsonInclude] public int          rank    = 1;  // probably should be called 'place'
                                                  // lowest ranked player is in the lead
  public int  criticalLevel   = 0;
  public bool buying          = true;
  public int  target          = 0;
  public int  current         = 0;

  public int[] startingRes = new[]{ 5, 2, 0, 0 };
  public int[] used        = new[]{ 0, 0, 0, 0 };
  public int[] spoiled     = new[]{ 0, 0, 0, 0 };
  public int[] produced    = new[]{ 0, 0, 0, 0 };
  
  public bool  energyShort = false; // we'll set this after the acution

  public WebSocket? ws = null;

  public Game? game = null;

  public Dictionary<Type, DelayedEvent> pendingEvents = new();

  public int plEvent = -1;

  public Player() {}
  public Player(PlayerColor pc) { color = pc; }

  public static bool operator ==(Player? p, PlayerColor? pc) { return p?.color == pc; }
  public static bool operator !=(Player? p, PlayerColor? pc) { return p?.color != pc; }
  public static bool operator ==(PlayerColor? pc, Player? p) { return p?.color == pc; }
  public static bool operator !=(PlayerColor? pc, Player? p) { return p?.color != pc; }

  public void send(Msg m)
  {
    if (ws == null) return;

    byte[] buf = JsonSerializer.SerializeToUtf8Bytes(m, m.GetType());

    Log(buf);

    _ = ws.SendAsync(buf, WebSocketMessageType.Text, true, CancellationToken.None);
  }

  string RemoveLandLots(string orig)
  {
    int i = orig.IndexOf("\"landlots\":");
    int st = i;
    if (i < 1) return orig;
    int count = 1;
    try {
     while (orig[i] != '{') i++;
     i++;
     while (count > 0)
     {
      if (orig[i] == '}') count--;
      else if (orig[i] == '{') count++;
      i++;
     }
     return $"{orig[..st]}\"landlots\":{{...}}{orig[i..]}";
    } catch {}
    return orig;
  }

  public void Log(byte[] buf, bool recv=false)
  {
    string msg = "\"", Send = recv ? "Recv" : "Send";
    msg = Encoding.UTF8.GetString(buf);
    if (recv) msg = msg.TrimEnd('\0');
    if (msg.Contains("Dest") || msg.Contains("Time")) return;
    msg = RemoveLandLots(msg);
    Console.WriteLine($"{DateTime.Now:h:mm:ss} {Send} {color.ToString()[0]} {msg}");
  }

  public override string ToString()
  {
    return color.ToString();
  }

  public bool RejoinStartedGame() 
  {
    if (game != null && game.active && game.started)
    {
      send(new CurrentGameState(game));
      
      if (game.state == GameState.AUCTION) 
        send(new CurrentAuction(game.auctionType, game.month, 
          game.resPrice[game.auctionType], game.colony.res[game.auctionType]));
      
      game.send(new PlayerRejoined(this));
      return true;
    }
    return false;
  }
      
  public bool JoinUnstartedGame(string? gameName, out string denialReason)
  {
    denialReason = "?";

    if (gameName is null)
    {
      denialReason = "didn't provide a game name";
      return false;
    }

    if (!Game.Map.ContainsKey(gameName))
    {
      denialReason = "game doesn't exist";
      return false;
    }

    Game g = Game.Map[gameName];
    if (g.players.Count > 3)
    {
      denialReason = "game is full";
      return false;
    }

    if (g.started)
    {
      denialReason = "game has already started";
      return false;
    }

    g.players.Add(this);

    if (g.starter?.ws is null && g.starter?.ip == this.ip)
    {
      // reconnect starter
      this.color = g.starter.color;
      this.name = g.starter.name;
      g.players.Remove(g.starter);
      g.starter = this;
    }
    else
    {
      if (g.Get(PlayerColor.R) is null) color = PlayerColor.R;
      else if (g.Get(PlayerColor.Y) is null) color = PlayerColor.Y;
      else if (g.Get(PlayerColor.G) is null) color = PlayerColor.G;
      else color = PlayerColor.B;
    }

    this.game = g;
    return true;
  }
}

