
record Msg (
  string? _mt
) 
{
  public virtual void OnRecv(Player p, Game g) { }
  public virtual void OnPreGameRecv(Player p)  { }
  public Msg() : this((string?)null) { _mt = GetType().Name; }
}

record SomeMsg (
  Player p, 
  List<string> props
) : Msg { 
  public override void OnRecv(Player p, Game g)
  {
    Console.WriteLine($"received {this} from {p}");
  }
}

record CreateGame (
  string name
) : Msg
{
  public override void OnPreGameRecv(Player p)
  {
    if (Game.Map.ContainsKey(name))
    {
      p.send(new GameNameExists());
      return;
    }

    Game g = new Game();
    Game.Map[name] = g;
    
    g.starter = p;
    g.started = false;
    g.name = name;
    g.players.Add(p);
    g.SetPlayerColor(p, PlayerColor.R);
    
    p.game = g;
    p.send(new GameCreated());
  }
}

record GameNameExists (
) : Msg;

record GameCreated (
) : Msg;

record Msg1() : Msg
{
  public override void OnPreGameRecv(Player p)
  {
    Console.WriteLine("processing " + _mt);
    p.send(this);
    for (long i = 0; i < 5999999999; i++) ;
    Console.WriteLine("Done adding all the crap.");
  }
}

record Msg2() : Msg
{
  public override void OnPreGameRecv(Player p)
  {
    Console.WriteLine("processing " + _mt);
    p.send(this);
  }
}