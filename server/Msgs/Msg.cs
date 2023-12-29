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

record Continue (
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    g.continueRecvd.Add(p.color);
    if (g.AllActivePlayersInSet(g.continueRecvd))
    {
      if (g.state == GameState.SCORE)
        g.UpdateGameState(GameState.IMPROVE);
    }
  }
}

record DestReached (
  PlayerColor pc,
  double x,
  double z
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (p.color != pc) return;
    p.x = x; p.z = z; p.dest = null;
    g.send(this);
  }
}

record NewDest (
  PlayerColor pc,
  double x,
  double z,
  double destx,
  double destz
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.x = x; p.z = z; p.dest = null;
    g.send(this);
  }
}

record NewMuleDest (
  PlayerColor pc,
  double x,
  double z,
  double destx,
  double destz
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.x = x; p.z = z; p.dest = null;
    g.send(this);
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