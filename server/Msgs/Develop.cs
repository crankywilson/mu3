
record MuleRequest (
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (g.mules < 1) 
      p.send(new MuleDenied("No more MULEs available"));
    else if (g.mulePrice > p.money)
      p.send(new MuleDenied("You can't afford a MULE"));
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

record RequestMuleOutfit (
  string res
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (!Enum.TryParse<ResourceType>(res, true, out ResourceType rt))
    {
      p.send(new MuleOutfitDenied("Unknown resource"));
      return;
    }

    int r = (int)rt;
    int cost = (r+1) * 25;
    if (p.money < cost)
    {
       p.send(new MuleOutfitDenied("You can't afford this outfitting"));
       return;
    }

    // up to client to ensure player actually has a MULE

    p.money -= cost;
    if (p.mule == null)
      p.mule = new();
    p.mule.resOutfit = r;
    g.send(new MuleOutfitAccepted(p.color, p.money, r));
  }
}

record MuleOutfitDenied (
    string reason
) : Msg;

record MuleOutfitAccepted (
    PlayerColor pc,
    int newMoney,
    int resOutfit
) : Msg;

record TurnedOnMuleLight (
    PlayerColor pc,
    int lightColor
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    g.send(this);
  }
}

record InstallMule (
  int e,
  int n
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    var ll = g.landlots[new LandLotID(e,n)];
    int oldr = ll.res;
    ll.res = p.mule?.resOutfit ?? -1;
    g.send(new MuleInstalled(p.color, ll.res, e, n, oldr));
    if (oldr != -1 && p.mule is not null)
      p.mule.resOutfit = oldr;
    else
      p.mule = null;
  }
}

record MuleInstalled (
  PlayerColor pc,
  int resType,
  int e,
  int n,
  int existingResType
) : Msg;