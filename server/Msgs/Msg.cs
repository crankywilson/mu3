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
          // possible auction... or...
          g.UpdateGameState(GameState.IMPROVE); break;
        case GameState.LANDAUCTION:
          g.UpdateGameState(GameState.IMPROVE); break;
        case GameState.PLAYEREVENT:
          g.UpdateGameState(GameState.IMPROVE); break;
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