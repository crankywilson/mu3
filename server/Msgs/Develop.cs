record StartTimer (
  int pct,
  int fullTimeMilliSecs
) : Msg;

record TimeUp (
  PlayerColor pc
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.send(this);
    p.mule = null;
    p.dest = null;
    p.x = 0;
    p.z = 0;
    new Continue().OnRecv(p, g);
    g.send(this);
  }
}

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
    p.mule.x = x; p.mule.z = z; p.mule.dest = new(destx, destz, destspd);
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
    var ll = g.landlots[new(e,n)];
    if (ll.owner != p) 
      { g.send(new MuleInstalled(p.color, -2, e, n, -2)); return; } // -2 does nothing but take player out of waiting state
    
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

record UninstallMule (
  int e,
  int n
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    var ll = g.landlots[new(e,n)];

    if (ll.owner != p) 
      { g.send(new MuleInstalled(p.color, -2, e, n, -2)); return; } // -2 does nothing but take player out of waiting state

    int oldr = ll.res;
    if (oldr > -1) p.mule = new MuleData(oldr, p);
    ll.res = -1;
    g.send(new MuleRemoved(p.color, e, n, oldr));
  }
}

record MuleRemoved (
  PlayerColor pc,
  int e,
  int n,
  int existingResType
) : Msg;

record SellMule (
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    //p.mule = null;  no this has to happen once removed from scene
    g.mules++;
    p.money += g.mulePrice;
    g.send(new MuleSold(g.mules, p.color, p.money));
  }
}

record MuleSold (
  int newNumMules,
  PlayerColor pc,
  int newMoney
) : Msg;

// only used for selling mule
record MuleRemovedFromScene (
  PlayerColor pc
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.mule = null;
    g.send(this);
  }
}

record Cantina (
  double pctTimeLeft
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    int winnings = (int)Math.Max(25, 200 * pctTimeLeft);
    p.money += winnings;
    g.send(new CantinaResult(p.color, winnings, p.money));
    new Continue().OnRecv(p,g);
  }
}

record CantinaResult (
  PlayerColor pc,
  int winnings,
  int newMoney
) :  Msg;

record Assay (
  int e,
  int n
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    g.send(new AssayResult(e, n, g.landlots[new(e,n)].crys));
  }
}

record AssayResult (
  int e,
  int n,
  int val
) : Msg;

record AuctionLot (
  int e,
  int n
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    g.plLotsToAuction.Add(new(e,n));
  }
}

record WumpusCaught (
  PlayerColor pc,
  int money
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (g.month < 5) p.money += 100;
    else if (g.month < 9) p.money += 200;
    else p.money += 300;
    g.send(new WumpusCaught(p.color, p.money));
  }
}


