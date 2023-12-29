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


record UpdateGameState (
  GameState gs
) : Msg;

record CurrentGameState (
  Game g
) : Msg;

record PlayerRejoined (
  Player p
) : Msg;