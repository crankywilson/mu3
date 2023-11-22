
using System.Collections.Concurrent;
using System.Text.Json.Serialization;
using System.Threading.Channels;

[JsonConverter(typeof(JsonStringEnumConverter))]  // use string for JSON Serialization
enum GameState {  
  /*GS*/ WAITINGFORALLJOIN      ,
  /*GS*/ SCORE                  ,
  /*GS*/ WAITFORLANDGRANT       ,
  /*GS*/ LANDGRANT              ,
  /*GS*/ WAITINGFORLANDAUCTION  ,
  /*GS*/ LANDAUCTION            ,
  /*GS*/ WAITINGTOSTARTIMPROVE  ,
  /*GS*/ IMPROVE                ,
  /*GS*/ PROD                   ,
  /*GS*/ AUCTIONPREP            ,
  /*GS*/ AUCTION                
}

class Game
{
  [JsonInclude] public LandLotDict              landlots = new();
  [JsonInclude] public int                      month    = 0;
  [JsonInclude] public string                   name     = "(Unnamed)";
  [JsonInclude] public List<Player>             players  = new List<Player>();
  [JsonInclude] public Player                   colony   = new Player();
  [JsonInclude] public GameState                state    = GameState.WAITINGFORALLJOIN;

  public bool started = true;     // this gets set to false when created on web, but is true by default for deserialization
  public Player? starter = null;
  public bool active = true;

  // each game having its own channel allows sychronicity within a game, but multiple games
  //  to be processed concurrently in parallel
  public Channel<ReceivedMsg> channel = 
    Channel.CreateUnbounded<ReceivedMsg>(
      new UnboundedChannelOptions
      {
        SingleWriter = false,
        SingleReader = true,
        AllowSynchronousContinuations = true
      });

  async Task RunMessageLoop()
  {
    while (active)
    {
      ReceivedMsg m = await channel.Reader.ReadAsync();
      m.msg.OnRecv(m.p, this);
    }
  }



  public Player? Get(PlayerColor pc)
  {
    foreach (var p in players)
      if (p.color == pc) return p;

    return null;
  }

  public void SetPlayerColor(Player p, PlayerColor pc)
  {
    Player? other = Get(p.color);
    if (other != null) other.color = p.color;
    p.color = pc;
  }

  public static ConcurrentDictionary<string, Game> Map = new();

  public static List<string> GetJoinableGameNames()
  {
    List<string> l = new();

    foreach (var kvp in Map)
    {
      if (!kvp.Value.started && kvp.Value.players.Count < 4)
        l.Add(kvp.Key);
    }

    return l;
  }

  public static Player? GetInactivePlayer(string? name, string? color)
  {
    if (!Enum.TryParse<PlayerColor>(color, true, out PlayerColor pc))
      return null;

    if (name == null || !Map.ContainsKey(name))
      return null;

    Game g = Map[name];
    Player? p = g.Get(pc);

    if (p == null || p.ws == null)
      return p;

    /* I wonder if it might make sense to wait a second or two here to see if an
     * out-of-order disconnect is eventually received, which would null out p.ws 
     * and validate this request...
     */

    return null;
  }

  public void send(Msg m)
  {
    foreach (Player p in players)
    {
      if (p.ws == null) continue;
        p.send(m);
    }
  }

}
