using System.Text;
using System.Text.Json.Serialization;

record Msg (
  string _mt
) 
{
  [JsonPropertyOrder(-1)]
  public string _mt { get; set; } = _mt;
  public virtual void OnRecv(Player p, Game g) { }
  public virtual void OnPreGameRecv(Player p)  { }
  public Msg() : this("") { _mt = GetType().Name; }
}

record ShowWaiting (
  PlayerColor pc
) : Msg;

record Continue (
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    g.continueRecvd.Add(p.color);
    g.send(new ShowWaiting(p.color));
    if (g.AllActivePlayersInSet(g.continueRecvd))
    {
      g.continueRecvd.Clear();
      switch (g.state)
      {
        case GameState.SCORE:
          g.UpdateGameState(GameState.LANDGRANT); break;
        case GameState.LANDGRANT:
          if (g.GetNumberOfAuctionPlots() > 0)
            g.AnnounceLandAuction();
          else
            g.UpdateGameState(GameState.PLAYEREVENT); 
          break;
        case GameState.SHOWLANDFORSALE:
          g.StartAuction(); break;
        case GameState.LANDAUCTION:
          if (g.GetNumberOfAuctionPlots() > 0)
            g.AnnounceLandAuction();
          else
           g.UpdateGameState(GameState.PLAYEREVENT); 
          break;
        case GameState.PLAYEREVENT:
          g.UpdateGameState(GameState.IMPROVE); 
          g.StartImproveTimer();
          break;
        case GameState.IMPROVE:
          g.UpdateGameState(GameState.PROD); g.DoProduction(); break;
        case GameState.PROD:
        case GameState.AUCTION:
          g.StartNextAuctionPrep(); break;
        case GameState.AUCTIONPREP:
          g.StartAuction(); break;
          
      }
    }
  }
}


record UpdateGameState (
  GameState gs
) : Msg;

record CurrentGameState (
  Game g
) : Msg;

record PlayerRejoined (
  Player p
) : Msg;

record LotAuction (
  int e,
  int n
 ) : Msg;

record ClaimLot (
  int e,
  int n
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (g.continueRecvd.Contains(p.color)) { p.send(new LotDenied()); return; };
    var id = new LandLotID(e,n);
    var ll = g.landlots[id];
    if (ll.owner != null) { p.send(new LotDenied()); return; };
    ll.owner = p.color;
    g.send(new LotGranted(p.color, id.str()));
    new Continue().OnRecv(p, g);
  }
}

record LotGranted (
  PlayerColor pc,
  string k
) : Msg;

record LotDenied (
) : Msg;

record PlayerEvent (
  PlayerColor pc,
  int money,
  string shortMsg,
  string? lotKey = null,
  bool? addLot = null
) : Msg;

record PlayerEventText (
  string fullMsg,
  bool isGood
) : Msg;

record ColonyEvent (
  string fullMsg,
  int eventType,
  string? lotKey,
  bool beforeProd
) : Msg;

record Production (
  string[] lotKeys
) : Msg;
