
using System;
using System.Net.Http.Json;
using System.Net.WebSockets;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]  // use string for JSON Serialization
enum PlayerColor { R, Y, G, B, NONE }
enum ResourceType { FOOD, ENERGY, SMITHORE, CRYSTITE }

class Player
{
  [JsonInclude] public string       name    = "";
  [JsonInclude] public string       ip      = "?";
  [JsonInclude] public int          money   = 1000;
  [JsonInclude] public int[]        res     = new int[4] { 5, 2, 0, 0 };
  [JsonInclude] public PlayerColor  color   = PlayerColor.NONE;
  [JsonInclude] public bool         isBot   = false;
  [JsonInclude] public PlayerColor  colrReq = PlayerColor.NONE;

  public WebSocket? ws = null;

  public Game? game = null;

  public Dictionary<Type, DelayedEvent> pendingEvents = new();

  public Player() {}
  public Player(PlayerColor pc) { color = pc; }

  public void send(Msg m)
  {
    if (ws == null) return;

    byte[] buf = JsonSerializer.SerializeToUtf8Bytes(m, m.GetType());

    Console.WriteLine($"{DateTime.Now:h:mm:ss} Send {color.ToString()[0]} {Encoding.UTF8.GetString(buf)}");

    _ = ws.SendAsync(buf, WebSocketMessageType.Text, true, CancellationToken.None);
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

