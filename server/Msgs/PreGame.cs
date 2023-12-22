

record AvailableGames (
  List<string> games
) : Msg
{
  public AvailableGames() : this(Game.GetJoinableGameNames()) {}
}

record CreateGame (
  string name,
  PlayerColor preferredColor
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
    g.SetPlayerColor(p, preferredColor);
    
    Task.Run(g.RunMessageLoop);

    p.game = g;
    p.send(new JoinedGameStats(g,p));
  }
}

record JoinGameRequest (
  string name
) : Msg
{
  public override void OnPreGameRecv(Player p)
  {
    if (p.JoinUnstartedGame(name, out string denialReason) && p.game != null)
      p.game.send(new JoinedGameStats(p.game, p));
    else
      p.send(new JoinGameDenial(denialReason));
  }
}

record JoinGameDenial (
  string reason
) : Msg;

record GameNameExists () : Msg;


record JoinedGameStats (
  string gameName,
  string ownerName,
  Player[] players,
  bool youAreOwner,
  PlayerColor currentColor
) : Msg
{
  public JoinedGameStats(Game g, Player p) 
  : this(g.name, g.starter?.name ?? "?", g.players.ToArray(), g.starter == p, p.color) 
  {
    foreach (var pl in g.players)
      if (pl.name.StartsWith('(') || pl.name.Length == 0)
        pl.name = "(" + pl.color + " Player)";
  }
}

record NameChange (
  string name
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.name = name;
    g.send(new JoinedGameStats(g, p));
  }
}

record ColorReq (
  string colorStr
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (Enum.TryParse<PlayerColor>(colorStr, out PlayerColor color))
    {
      if (p.game?.Get(color) is null)
        p.color = color;
      else
        p.colrReq = color;
      p.game?.send(new JoinedGameStats(p.game, p));
    }
  }
}

record SetColor (
  string colorStr
) : Msg
{
  public override void OnPreGameRecv(Player p)
  {

  }
}


record Kick (
  string colorStr
) : Msg
{
  public override void OnPreGameRecv(Player p)
  {

  }
}


record StartGame (
) : Msg
{
  public override void OnPreGameRecv(Player p)
  {
  }
}


