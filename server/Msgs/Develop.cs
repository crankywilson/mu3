
record MuleRequest (
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (g.mules < 1) 
      p.send(new MuleDenied(p.color, "No more MULEs available"));
    else if (g.mulePrice > p.money)
      p.send(new MuleDenied(p.color, "You can't afford a MULE"));
    else
    {
      g.mules--;
      p.money-=g.mulePrice;
      p.mule = new MuleData();
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

record MuleDestReached (
  PlayerColor pc,
  double x,
  double z
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (p.color != pc) return;
    if (p.mule == null)
      p.mule = new MuleData();
    p.mule.dest = null;
    p.mule.x = x;
    p.mule.z = z;
    g.send(this);
  }
}

record NewDest (
  PlayerColor pc,
  double x,
  double z,
  double destx,
  double destz,
  double destspd
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.x = x; p.z = z; p.dest = new Dest(destx, destz, destspd);
    g.send(this);
  }
}

record NewMuleDest (
  PlayerColor pc,
  double x,
  double z,
  double destx,
  double destz,
  double destspd
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (p.mule == null)
      p.mule = new MuleData();
    p.mule.x = x; p.mule.z = z; p.dest = new(destx, destz, destspd);
    g.send(this);
  }
}