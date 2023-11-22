
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

  public WebSocket? ws = null;

  public Game? game = null;

  public Dictionary<Type, DelayedEvent> pendingEvents = new();

  public Player() {}
  public Player(PlayerColor pc) { color = pc; }

  public void send(Msg m)
  {
    if (ws == null) return;
    _ = ws.SendAsync(JsonSerializer.SerializeToUtf8Bytes(m), WebSocketMessageType.Text, true, CancellationToken.None);
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
      
  public bool JoinUnstartedGame(string? gameName, out string denailReason)
  {
    denailReason = "?";
    return false;
  }
}

