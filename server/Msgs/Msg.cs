record Msg (
  string? _mt
) 
{
  public virtual void OnRecv(Player p, Game g) { }
  public virtual void OnPreGameRecv(Player p)  { }
  public Msg() : this((string?)null) { _mt = GetType().Name; }
}

record CurrentGameState (
  Game g
) : Msg;

record PlayerRejoined (
  Player p
) : Msg;