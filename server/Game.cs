
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
  [JsonInclude] public int                      month    = 1;
  [JsonInclude] public string                   name     = "(Unnamed)";
  [JsonInclude] public List<Player>             players  = new List<Player>();
  [JsonInclude] public Player                   colony   = new Player();
  [JsonInclude] public GameState                state    = GameState.WAITINGFORALLJOIN;

  public bool started = true;     // this gets set to false when created on web, but is true by default for deserialization
  public Player? starter = null;
  public bool active = true;

  public Random rand = new Random();
  public HashSet<PlayerColor> continueRecvd = new();

  public bool AllActivePlayersInSet(HashSet<PlayerColor> set)
  {
    foreach (var p in players)
      if (p.ws != null && !set.Contains(p.color)) return false;
    
    return true;
  }

  public void UpdateGameState(GameState gs)
  {
    state = gs;
    send(new UpdateGameState(gs));
  }
  
  // each game having its own channel allows synchronicity within a game, but multiple games
  //  to be processed concurrently in parallel
  public Channel<ReceivedMsg> channel = 
    Channel.CreateUnbounded<ReceivedMsg>(
      new UnboundedChannelOptions
      {
        SingleWriter = false,
        SingleReader = true,
        AllowSynchronousContinuations = true
      });

  public async Task RunMessageLoop()
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

  public void DistributeCrystitie(LandLotID k, int lvl)
  {
    if (landlots[k].crys < lvl)
      landlots[k].crys = lvl;
    if (lvl > 1)
    {
      if (k.e > -4)
        DistributeCrystitie(new LandLotID(k.e-1, k.n), lvl-1);
      if (k.e < 4)
        DistributeCrystitie(new LandLotID(k.e+1, k.n), lvl-1);
      if (k.n > -2)
        DistributeCrystitie(new LandLotID(k.e, k.n-1), lvl-1);
      if (k.n < 2)
        DistributeCrystitie(new LandLotID(k.e, k.n+1), lvl-1);
    }
  }

  public void Start()
  {
    List<LandLotID> availMoundPlots = new();
    List<LandLotID> availHCPlots = new();

    /* init landlots */
    for (int row=-2; row<=2; row++)
    {
      for (int col=-4; col<=4; col++)
      {
        LandLotID k = new LandLotID(col, row);
        landlots[k] = new();
        if (col != 0)
          availMoundPlots.Add(k);
        availHCPlots.Add(k);
      }
    }

    /* init mounds */
    for (int i=0; i<9; i++)
    {
      int ri = rand.Next(availMoundPlots.Count);
      LandLotID k = availMoundPlots[ri];
      availMoundPlots.Remove(k);
      landlots[k].numMounds = (i % 3) + 1;
      int x = k.e;
      int z = k.n;
      var g = landlots[k].moundGeom;
      for (int j=0; j<landlots[k].numMounds; j++)
      {
        g.Add(x * 4f - 1.6f + rand.NextSingle()*3.2f);
        g.Add(rand.NextSingle()*6.28f);
        g.Add(z * 4f - 1.6f + rand.NextSingle()*3.2f);
        g.Add(.2f + (rand.NextSingle() - .2f) / 4f);
        g.Add(.2f + (rand.NextSingle() / 3));
        g.Add(.2f + (rand.NextSingle()- .2f) / 4f);
      }
    }

    /* init crystite */
    for (int i=0; i<3; i++)
    {
      int ri = rand.Next(availHCPlots.Count);
      LandLotID k = availHCPlots[ri];
      availHCPlots.Remove(k);
      DistributeCrystitie(k, 3);
    }

    started = true;
    state = GameState.SCORE;
    send(new CurrentGameState(this));
  }

  public void send(Msg m)
  {
    foreach (Player p in players)
    {
      if (p.ws == null) continue;
      if (m is JoinedGameStats) m = new JoinedGameStats(p.game ?? new(), p);
      p.send(m);
    }
  }

}
