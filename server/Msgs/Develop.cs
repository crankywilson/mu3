
record MuleRequest (
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (g.mules < 1) 
      p.send(new MuleDenied("No more MULEs available"));
    else if *g.mulePrice > p.money)
      p.send(new MuleDenied("You can't afford a MULE"));
    else
    {
      g.mules--;
      p.money-=g.mulePrice;
      g.send(new MuleObtained(p.color, p.money, g.mules));
    }
  }
}

record MuleObtained (
    PlayerColor pc,
    int newMoney,
    int numMules
) : Msg;

record MuleDenied (
    PlayerColor pc,
    string reason
) : Msg;
