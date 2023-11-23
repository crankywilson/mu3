

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
  : this(g.name, g.starter?.name ?? "?", g.players.ToArray(), g.starter == p, p.color) {}
}
