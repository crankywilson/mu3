
using System.Collections.Concurrent;
using System.ComponentModel;
using System.Text.Json.Serialization;
using System.Threading.Channels;


[JsonConverter(typeof(JsonStringEnumConverter))]  // use string for JSON Serialization
enum GameState {  
  /*GS*/ WAITINGFORALLJOIN      ,
  /*GS*/ SCORE                  ,
  /*GS*/ LANDGRANT              ,
  /*GS*/ WAITINGFORLANDAUCTION  ,
  /*GS*/ LANDAUCTION            ,
  /*GS*/ PLAYEREVENT            ,
  /*GS*/ IMPROVE                ,
  /*GS*/ PROD                   ,
  /*GS*/ AUCTIONPREP            ,
  /*GS*/ AUCTION                
}

partial
class Game
{
  [JsonInclude] public LandLotDict     landlots  = new();
  [JsonInclude] public int             month     = 1;
  [JsonInclude] public string          name      = "(Unnamed)";
  [JsonInclude] public List<Player>    players   = new List<Player>();
  [JsonInclude] public Player          colony    = new Player();
  [JsonInclude] public GameState       state     = GameState.WAITINGFORALLJOIN;
  [JsonInclude] public int             mules     = 14;
  [JsonInclude] public int             mulePrice = 100;
  [JsonInclude] public int[]           resPrice  = new int[4] { 15, 10, 40, 100 };
       public HashSet<LandLotID> plLotsToAuction = new();

  List<int> possibleColonyEvents = new(){-1,0,1,2,3,4,5,6,7,0,1,2,3,4,5,6,7,0,1,2,3,-1};
  List<int> possibleGoodPlayerEvents = Enumerable.Range(0, 13).ToList();
  List<int> possibleBadPlayerEvents  = Enumerable.Range(13, 9).ToList();
  
  public int colonyEvent = -1;

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

  public int PopRandom(List<int> l)
  {
    if (l.Count == 0) return -1;
    int i = rand.Next(l.Count);
    int ret = l[i];
    l.RemoveAt(i);

    if (l.Count == 0 && l == possibleGoodPlayerEvents) l.AddRange(Enumerable.Range(0, 13).ToList());
    if (l.Count == 0 && l == possibleBadPlayerEvents) l.AddRange(Enumerable.Range(13, 9).ToList());

    return ret;
  }

  const int FOOD = (int) ResourceType.FOOD;
  const int ENERGY = (int) ResourceType.ENERGY;
  const int SMITHORE = (int) ResourceType.SMITHORE;
  const int CRYSTITE = (int) ResourceType.CRYSTITE;

  const int LAND = CRYSTITE + 1;
  const int NONE = -1;

  public int auctionType = NONE;

  public void SendPlayerEvents()
  {
    foreach (var p in players)
    {
      string shortMsg = "?", longMsg = "?";
      string? lotKey = null;
      bool?   addLot = null;
      int m = 0;
      p.plEvent = -1;
      double goodEvtProb = (double)p.rank/(players.Count + 2);
      double badEventProb = (double)(players.Count-p.rank)/(players.Count + 3);
      double r = rand.NextDouble();
      if (r >= (1.0 - goodEvtProb))
        p.plEvent = PopRandom(possibleGoodPlayerEvents);
      else if (r < badEventProb)
        p.plEvent = PopRandom(possibleBadPlayerEvents);
      else
        continue;

      longMsg = pe[p.plEvent];

      switch (p.plEvent)
      {
        case 0:
          shortMsg = "+3 F, +2 E";
          p.res[FOOD] += 3;
          p.res[ENERGY] += 2;
          break;
        case 1:
          shortMsg = "+2 Sm";
          p.res[SMITHORE] += 2;
          break;
        case 2:
          m = (rand.Next(month)+1)*25;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 3:
          m = (rand.Next(month)+1)*25;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 4:
          m = (rand.Next(1)+1)*25*p.res[FOOD];
          if (m <= 0) { p.plEvent = -1; continue; }
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("1?", (m/p.res[FOOD]).ToString());
          longMsg = longMsg.Replace("2?", m.ToString());
          break;
        case 5:
          m = (rand.Next(1)+1)*25;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 6:
          m = ((int)(month/4)+1)*200;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 7:
          m = ((int)(month/4)+1)*50;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 8:
          m = ((int)(month/3)+1)*50;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 9:
          m = (rand.Next(40)+11)*month;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 10:
          m = (rand.Next(15)+11)*month;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 11:
          m = ((int)(month/3)+1)*50;
          shortMsg = $"+(₿) {m}";
          p.money += m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 12: {
          var l = new List<LandLotID>();
          foreach (var kv in landlots)
            if (kv.Value.owner is null) l.Add(kv.Key);
          if (l.Count == 0) { p.plEvent = -1; continue; }
          var k = l[rand.Next(l.Count)];
          landlots[k].owner = p.color;
          lotKey = k.str();
          addLot = true;
          shortMsg = $"Grant " + lotKey;
          break; }
        case 13:
          m = (int)(p.res[FOOD]/2);
          if (m == 0) { p.plEvent = -1; continue; }
          shortMsg = $"-{m} Food";
          p.res[FOOD] -= m;
          break;
        case 14:
          m = (rand.Next(month)+1)*25;
          if (m >= p.money || month == 1) { p.plEvent = -1; continue; }
          p.money -= m;
          shortMsg = $"-(₿) {m}";
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 15: {
          m = ((int)(month/3)+1)*25;
          longMsg = longMsg.Replace("1?", m.ToString());
          int n = 0;
          foreach (var kv in landlots)
            if (kv.Value.owner == p && kv.Value.res >= SMITHORE) n++;
          m *= n;
          if (m == 0 || m >= p.money) { p.plEvent = -1; continue; }
          p.money -= m;
          shortMsg = $"-(₿) {m}";
          longMsg = longMsg.Replace("2?", m.ToString());
          break; }
        case 16: {
          m = ((int)(month/3)+1)*25;
          longMsg = longMsg.Replace("1?", m.ToString());
          int n = 0;
          foreach (var kv in landlots)
            if (kv.Value.owner == p && kv.Value.res == ENERGY) n++;
          m *= n;
          if (m == 0 || m >= p.money) { p.plEvent = -1; continue; }
          p.money -= m;
          shortMsg = $"-(₿) {m}";
          longMsg = longMsg.Replace("2?", m.ToString());
          break; }
        case 17:
          m = (rand.Next(50)+21)*(int)(month/4);
          if (m >= p.money) { p.plEvent = -1; continue; }
          shortMsg = $"-(₿) {m}";
          p.money -= m;
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 18:
          m = (rand.Next(40)+11)*month;
          if (m >= p.money) { p.plEvent = -1; continue; }
          p.money -= m;
          shortMsg = $"-(₿) {m}";
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 19:
          m = (rand.Next(15)+11)*month;
          if (m >= p.money) { p.plEvent = -1; continue; }
          p.money -= m;
          shortMsg = $"-(₿) {m}";
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 20:
          m = ((int)(month/4)+1)*200;
          if (m >= p.money) { p.plEvent = -1; continue; }
          p.money -= m;
          shortMsg = $"-(₿) {m}";
          longMsg = longMsg.Replace("?", m.ToString());
          break;
        case 21: {
          var l = new List<LandLotID>();
          foreach (var kv in landlots)
            if (kv.Value.owner == p.color) l.Add(kv.Key);
          if (l.Count == 0) { p.plEvent = -1; continue; }
          var k = l[rand.Next(l.Count)];
          landlots[k].owner = p.color;
          lotKey = k.str();
          addLot = false;
          shortMsg = $"Lost " + lotKey;
          break; }
      }

      if (p.plEvent > -1)
      {
        send(new PlayerEvent(p.color, p.money, shortMsg, lotKey, addLot));
        p.send(new PlayerEventText(longMsg, p.plEvent < 13));
      }
    }
  }

  public void UpdateGameState(GameState gs)
  {
    state = gs;
    send(new UpdateGameState(gs));

    if (gs == GameState.PLAYEREVENT)
      SendPlayerEvents();      
  }
  
  public void StartNextAuctionPrep()
  {
    if (auctionType == CRYSTITE)
    {
      auctionType = NONE;
      UpdateScores();
      UpdateGameState(GameState.SCORE);
      return;
    }

    auctionType++;
    int amtFoodNeeded = AmountFoodNeeded(month + 1);

    foreach (var p in players)
    {
      int surplus = p.res[auctionType];

      if (auctionType == FOOD)
        surplus = p.res[FOOD] - amtFoodNeeded;
      else if (auctionType == ENERGY)
        surplus = p.res[ENERGY] - AmtEnergyNeeded(p);

      send(new PreAuctionStat(p.color, 
        p.startingRes[auctionType], p.used[auctionType], 
        p.spoiled[auctionType], p.produced[auctionType], 
        p.res[auctionType], surplus));
    }

    send(new CurrentAuction(auctionType, month, 
        resPrice[auctionType], colony.res[auctionType]));

    UpdateGameState(GameState.AUCTIONPREP);
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
    Player? other = Get(pc);
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

  float r(float f)
  {
    return (float) Math.Round((double)f, 2);
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
      landlots[k].mNum = (i % 3) + 1;
      int x = k.e;
      int z = k.n;
      var g = landlots[k].mg;
      for (int j=0; j<landlots[k].mNum; j++)
      {
        g.Add(r(x * 4f - 1.6f + rand.NextSingle()*3.2f));
        g.Add(r(rand.NextSingle()*6.28f));
        g.Add(r(z * 4f - 1.6f + rand.NextSingle()*3.2f));
        g.Add(r(.2f + (rand.NextSingle() - .2f) / 4f));
        g.Add(r(.2f + (rand.NextSingle() / 3)));
        g.Add(r(.2f + (rand.NextSingle()- .2f) / 4f));
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

    colony.game = this;
    colony.color = PlayerColor.COLONY;
    colony.rank = 0;
    started = true;
    UpdateScores();
    state = GameState.SCORE;
    send(new CurrentGameState(this));
    // get rid of this when done auction dev:
    StartNextAuctionPrep();
  }

  public void UpdateScores()
  {
    foreach (var p in players)
    {
      p.score = p.money;
      for (int r = 0; r<4; r++)
        p.score += resPrice[r] * p.res[r];
      foreach (var ll in landlots.Values) {
        if (ll.owner == p) {
          p.score += 500; if (ll.res > -1) {
            p.score += mulePrice; } }
      }
    }

    players.Sort(delegate(Player p1, Player p2) 
      { return p2.score - p1.score; } );
    
    int rank = 0;
    foreach (var p in players) p.rank = ++rank;
  }

  delegate bool LLCond(LandLot ll);
  string RandomLotWithCondition(LLCond? lldelegate)
  {
    List<LandLotID> candidates = new();
    foreach (var pair in landlots)
    { 
      if (lldelegate is null) { if (pair.Key.e != 0) candidates.Add(pair.Key); }
      else if (lldelegate(pair.Value)) candidates.Add(pair.Key);
    }
    if (candidates.Count == 0) 
    {
      colonyEvent = -1;
      return "?"; 
    }
    else
      return candidates[rand.Next(candidates.Count)].str();
  }

  LandLot LL(string k)
  {
    if (k.Length < 4) return new LandLot();
    var llid = LandLotID.FromString(k);
    if (!landlots.ContainsKey(llid)) return new LandLot();
    return landlots[llid];
  }

  public int AmountFoodNeeded(int month)
  {
    if (month >= 8)
      return 5;
    if (month >= 4)
      return 4;
    return 3;
  }

  public int AmtEnergyNeeded(Player p)
  {
    int amtEnergyNeeded = 0;
    foreach (var ll in landlots)
    {
      if (ll.Value.owner != p) continue;
      if (ll.Value.res > -1 && ll.Value.res != ENERGY)
        amtEnergyNeeded++;
    }

    return amtEnergyNeeded;
  }

  public void DoProduction()
  {
    const int QUAKE = 0;
    const int PEST = 1;
    const int SUNSPOT = 2;
    const int RAIN = 3;
    const int FIRE = 4;
    const int ASTEROID = 5;
    const int MULERAD = 6;
    const int PIRATES = 7;

    List<LandLotID> lotsWithoutEnergy = new();
    int amtFoodNeeded = AmountFoodNeeded(month);

    foreach (Player p in players)
    {
      for (int i=0; i<4; i++)
        p.startingRes[i] = p.res[i];

      p.used[FOOD] -= Math.Min(amtFoodNeeded, p.res[FOOD]);
      p.res[FOOD] -= p.used[FOOD];
      p.spoiled[FOOD] = p.res[FOOD] / 2;
      p.res[FOOD] -= p.spoiled[FOOD];

      List<LandLotID> nonEnergyLots = new();
      int amtEnergyNeeded = 0;
      foreach (var ll in landlots)
      {
        if (ll.Value.owner != p) continue;
        if (ll.Value.res > -1 && ll.Value.res != ENERGY)
        {
          amtEnergyNeeded++;
          if (p.energyShort) nonEnergyLots.Add(ll.Key);
        }
      }

      if (p.energyShort)
      {
        int shortage = amtEnergyNeeded - p.res[ENERGY];
        while (shortage > 0 && nonEnergyLots.Count > 0)
        {
          int r = rand.Next(nonEnergyLots.Count);
          var k = nonEnergyLots[r];
          nonEnergyLots.RemoveAt(r);
          lotsWithoutEnergy.Add(k);
          shortage--;
        }
      }

      p.used[ENERGY] -= Math.Min(amtEnergyNeeded, p.res[ENERGY]);
      p.res[ENERGY] -= p.used[ENERGY];
      p.spoiled[ENERGY] = p.res[ENERGY] / 4;
      p.res[ENERGY] -= p.spoiled[ENERGY];

      p.spoiled[SMITHORE] = p.res[SMITHORE] < 50 ? 0 : p.res[SMITHORE] - 50;
      p.res[SMITHORE] -= p.spoiled[SMITHORE];

      p.spoiled[CRYSTITE] = p.res[CRYSTITE] < 50 ? 0 : p.res[CRYSTITE] - 50;
      p.res[CRYSTITE] -= p.spoiled[CRYSTITE];

      p.produced = new[] {0,0,0,0};
    }



    colonyEvent = PopRandom(possibleColonyEvents);
  
    string fullMsg = "";
    string? lotKey = null;
    int rainRow = -3;

    if (colonyEvent > -1)
      fullMsg = ce[colonyEvent];
    if (colonyEvent == PEST)
      lotKey = RandomLotWithCondition(ll=>ll.res == FOOD); // updates colonyEvent to -1 if needed...
    else if (colonyEvent == MULERAD) 
    {
      lotKey = RandomLotWithCondition(ll=>ll.res > -1 && ll.owner != null);
      LL(lotKey).res = -1;
    }
    else if (colonyEvent == ASTEROID)
    {
      lotKey = RandomLotWithCondition(null);
      LL(lotKey).res = -1;
      LL(lotKey).crys = 4;
    }

    if (lotKey != null)
      fullMsg = fullMsg.Replace("?", lotKey);


    List<string> rkeys = new(); // each element in here will be a production dot
    foreach (var pair in landlots)
    {
      if (lotsWithoutEnergy.Contains(pair.Key))
        continue;

      var k = pair.Key;
      var res = pair.Value.res;
      Player? p = Get(pair.Value.owner ?? PlayerColor.NONE);
      if (p != null && res > -1)
      {      
        int numResProduced = 8;
        if (colonyEvent == RAIN)
        {
          if (pair.Key.n == rainRow) {}
        }
        if (colonyEvent == SUNSPOT)
        {
        }
        if (colonyEvent == QUAKE)
        {
        }
        for (int i=0; i<numResProduced; i++) rkeys.Add(pair.Key.str());

        bool thisWasPestAttack = (colonyEvent == PEST) && (k.str() == lotKey);
        bool thisWasStolenCrys = (colonyEvent == PIRATES) && (res == CRYSTITE);
        
        if (res >= 0 && !thisWasPestAttack && !thisWasStolenCrys)
        {
          p.produced[res] += numResProduced;
          p.res[res] += numResProduced;
        }
      }
    }

    if (colonyEvent == PIRATES)
    {
      foreach (Player p in players)
      { 
        p.startingRes[CRYSTITE] = 0;
        p.spoiled[CRYSTITE] = 0;
      }
    }

    if (colonyEvent == FIRE)
      colony.res = new[] {0,0,0,0}; 

    var keyArray = rkeys.ToArray();
    rand.Shuffle(keyArray);

    bool beforeProd = new[]{ 0, 2, 3, 5, 6 }.Contains(colonyEvent);

    send(new ColonyEvent(fullMsg, colonyEvent, lotKey, beforeProd));
    send(new Production(keyArray));
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

  string[] pe = new[] {
/*0*/"You just received a package from your home-world relatives containing 3 food and 2 energy units.",
/*1*/"A wandering space traveler repaid your hospitality by leaving two bars of smithore.",
/*2*/"Your MULE was judged \"best built\" at the colony fair. You won (₿) ?",  //150 r8
/*3*/"Your MULE won the colony tap-dancing contest. You collected (₿) ?.",  //200 r4
/*4*/"The colony council for agriculture awarded you (₿) 1? for each food lot you have developed. The total grant is (₿) 2?.",  //50 r2
/*5*/"The colony awarded you (₿) ? for stopping the wart worm infestation.", //200 r7
/*6*/"The museum bought your antique personal computer for (₿) ?.",  //600 r8
/*7*/"You won the colony swamp eel eating contest and collected (₿) ?. (Yuck!)",  //150 r8
/*8*/"A charity from your home-world took pity on you and sent (₿) ?.", //150 r7
/*9*/"Your offworld investments in artificial dumbness paid (₿) ? in dividends.",
/*10*/"A distant relative died and left you a vast fortune٬ but after taxes you only got (₿) ?.",  //200 r6
/*11*/"You found a dead moose rat and sold the hide for (₿) ?.",  //50 r1
/*12*/"You received an extra lot of land to encourage colony development.",
// above are good, below are bad
/*13*/"Mischievous glac-elves broke into your storage shed and stole half your food.",
/*14*/"One of your MULEs lost a bolt. Repairs cost you (₿) ?.", //225 r9
/*15*/"Your mining MULEs have deteriorated from heavy use and cost (₿) 1? each to repair. The total cost is (₿) 2?.",
/*16*/"The solar collectors on your energy MULEs are dirty. Cleaning cost you (₿) 1? Each for a total of (₿) 2?.",
/*17*/"Your space gypsy inlaws made a mess of the settlement. It cost you (₿) ? to clean it up.",
/*18*/"Flying cat-bugs ate the roof off your dwelling. Repairs cost (₿) ?.",
/*19*/"You lost (₿) ? betting on the two-legged kazinga races.",  //200 r5
/*20*/"Your child was bitten by a bat lizard and the hospital bill cost you (₿) ?.",
/*21*/"You lost a lot of land because the claim was not recorded."};

// wampus 100 1-4, 200 5-8, 300 9-

  string[] ce = new[] {
/*0*/"A planetquake reduces mining production!",                             // 15% 3 times max
/*1*/"A pest attack on lot ? causes all food to be destroyed!",              // 15% 3 times max
/*2*/"Sunspot activity increases energy production!",                        // 15% 3 times max
/*3*/"Acid rain increases food production, but decreases energy production.",// 15% 3 times max
/*4*/"A fire at the settlement destroys all colony-held goods!",             // 10% 2 times max
/*5*/"An asteroid smashes into lot ?٬ making a new crystite deposit!",       // 10% 2 times max
/*6*/"Space radiation destroys the MULE at lot ?!",                          // 10% 2 times max
/*7*/"Space pirates steal all crystite!"};                                   // 10% 2 times max

  Dictionary<int,string> et = new() {
  {0,      "Overall٬ the colony failed...dismally. The Federation debtors' prison is your new home!"},
  {20000,  "Overall٬ the colony failed...The Federation will no longer send trade ships. You are on your own!"},
  {40000,  "Overall٬ the colony survived...barely. You will be living in tents. Few trading ships will come your way!"},
  {60000,  "Overall٬ the colony was a success. You have met the minimum standards set by the Federation٬ but your life will not be easy!"},
  {80000,  "Overall٬ the colony succeeded. The Federation is pleased by your efforts. You will live comfortably!"},
  {100000, "Overall٬ the colony succeeded...extremely well. You can now retire in elegant estates!"},
  {120000, "Overall٬ the colony delighted the Federation with your exceptional achievement. Your retirement will be luxurious!"}
  };
}
