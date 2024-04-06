using static AuctionConstants;

record PreAuctionStat (
  PlayerColor pc,
  int start,
  int used,
  int spoiled,
  int produced,
  int current,
  int surplus
) : Msg;

record CurrentAuction (
  int auctionType,
  int month,
  int resPrice,
  int avail
) : Msg;

record AuctionStart (
  int auctionType,
  int month,
  int resPrice,
  int avail
) : Msg;

record BuySell (
  PlayerColor pc,
  bool buy
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.buying = buy;
    g.send(this);
    if (g.state == GameState.AUCTIONPREP)
      new Continue().OnRecv(p, g);
    else
    {
      p.current = buy ? BUY : SELL;
      p.target = buy ? BUY : SELL;
      g.UpdateBids(p);
    }
  }
}

record AuctionTargetBid (
  int target
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    p.target = target;

    bool stopTrade = false;
    if (g.activeTrade is not null)
    {
      if (p == g.activeTrade.buyer && target < g.activeTrade.price)
        stopTrade = true;
      else if (p == g.activeTrade.seller && target > g.activeTrade.price)
        stopTrade = true;
      if (stopTrade)
      {
        g.activeTrade = null;
        g.tradeID++;
        g.send(new TradeEnd());
        g.UpdateBids(p);  // may start a new trade
      }
    }
  }
}

record Bid (
  PlayerColor pc,
  int amt,
  bool buying
) : Msg;

record Bids (
  Bid[] current,
  int lowestSellPrice,
  int highestBuyPrice,
  bool storeBuy,
  int minBid
) : Msg;

record HighlightTrade (
  PlayerColor buyer,
  PlayerColor seller,
  int price
) : Msg;

record TradeEnd (
) : Msg;

record Res (
  PlayerColor pc,
  int res,
  int money,
  int needed,
  string label
) : Msg
{
  public Res(Player p, Game g) : this(p.color, p.res[g.auctionType],
                                      p.money,  p.criticalLevel, 
          Enum.GetName(typeof(ResourceType), g.auctionType) ?? "") {}
}


record UnitsTraded (
  int num,
  Res seller,
  Res buyer
) : Msg;

record AuctionTime (
  double num
) : Msg;

record CurrentLeader (
  bool anyBidders,
  PlayerColor p
) : Msg;

record AuctionResult (
  bool sold,
  PlayerColor winner,
  int newMoney,
  LandLotID lot
) : Msg;

record TradeConfirmed (
  int tradeID
) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (g.activeTrade is null) return;
    var t = g.activeTrade;
    if (t.tradeID != g.tradeID) return;

    if (p == t.buyer) g.buyerConfirmed = true;
    else if (p == t.seller) g.sellerConfirmed = true;

    if (!(g.buyerConfirmed && g.sellerConfirmed)) return;

    // trade confirmed by both buyer and seller -- execute
    t.buyer.money -= t.price;
    t.seller.money += t.price;
    t.buyer.res[g.auctionType] += 1;
    t.seller.res[g.auctionType] -= 1;
    
    g.tradePrices[g.auctionType].Add(t.price);
    
    g.send(new UnitsTraded(t.unitsTraded, new Res(t.buyer, g), new Res(t.seller, g)));

    string? sellerResetStr = null;

    if (t.seller.res[g.auctionType] <= 0)
      sellerResetStr = "Seller has no units left";
    else if (t.seller.res[g.auctionType] == t.seller.criticalLevel)
      sellerResetStr = "Seller at critical level";

    if (sellerResetStr is not null)
    {
      t.seller.current = SELL;
      t.seller.target = SELL;
      g.send(new SellerReset(sellerResetStr, t.seller.color, t.seller.target, t.seller.current));
      g.send(new TradeEnd());
      g.activeTrade = null;
      g.UpdateBids(t.seller);
    }
    
    string? buyerResetStr = null;
    if (t.buyer.money < g.resPrice[g.auctionType])
      buyerResetStr = "Buyer strapped for cash";

    if (buyerResetStr is not null)
    {
      t.buyer.current = BUY;
      t.buyer.target = BUY;
      g.send(new SellerReset(buyerResetStr, t.buyer.color, t.buyer.target, t.buyer.current));
      g.send(new TradeEnd());
      g.activeTrade = null;
      g.UpdateBids(t.buyer);
    }

    g.tradeID++;

    if (g.activeTrade is null)
      return;

    g.activeTrade = new(g.tradeID, t.buyer, t.seller, t.price, t.unitsTraded + 1);
    int delay = Math.Max(100, 1000 - (t.unitsTraded * 150));
    new ConfirmTradeAfterDelay(g.activeTrade).Schedule(delay, g);
  }
}



static class AuctionConstants {
  public const int BUY = 0;
  public const int SELL = 9999;
};

public record ActiveTrade
(
  int tradeID,
  Player buyer,
  Player seller,
  int price,
  int unitsTraded
);


partial class Game
{
  public int tradeID = 0;
  public int bidIncrement = 1;
  public bool storeBuy = true;
  public bool bidChangeThisCycle = false;
  public int auctionTime = 5000;
  public int minBid = 10;
  public int maxBid = 45;
  public bool buyerConfirmed = false;
  public bool sellerConfirmed = false;
  public ActiveTrade? activeTrade = null;
}

record ConfirmTrade (
  int tradeID,
  PlayerColor buyer,
  PlayerColor seller,
  int price
) : Msg;

record BuyerReset (
  string msg,
  PlayerColor pc,
  int target,
  int bid
) : Msg;

record SellerReset (
  string msg,
  PlayerColor pc,
  int target,
  int bid
) : Msg;

class CanelTradeIfNotConfirmed : AuctionEvent
{
  int tradeID;
  public CanelTradeIfNotConfirmed(int tradeID) { this.tradeID = tradeID; }
  public override void OnTimeElapsed(Player p, Game g) 
  {
    g.CancelTradeIfNotConfirmed(tradeID);
  }
}

partial class Game { 
 public void CancelTradeIfNotConfirmed(int origTadeID) 
 {
  bool cancelRequired = false;
  if (activeTrade is null) return;
  Player buyer = activeTrade.buyer;
  Player seller = activeTrade.seller;
  if (origTadeID == tradeID && buyer is not null && seller is not null)
  {
    if (!buyerConfirmed)
    {
      buyer.current = BUY;
      buyer.target = buyer.current;
      send(new BuyerReset("No trade confirmation received", buyer.color, buyer.target, buyer.current));
      cancelRequired = true; 
    }
    if (!sellerConfirmed)
    {
      seller.current = SELL;
      seller.target = seller.current;
      send(new SellerReset("No trade confirmation received", seller.color, seller.target, seller.current));
      cancelRequired = true; 
    }
    if (cancelRequired)
    {
      tradeID++;
      activeTrade = null;
      send(new TradeEnd());
    }
  }
}}

class ConfirmTradeAfterDelay : AuctionEvent
{
  ActiveTrade activeTrade;
  public ConfirmTradeAfterDelay(ActiveTrade at) { activeTrade = at; }
  public override void OnTimeElapsed(Player p, Game g) {
    if (activeTrade == g.activeTrade)
    {
      g.buyerConfirmed = activeTrade.buyer == g.colony;
      g.sellerConfirmed = activeTrade.seller == g.colony;
      var ct = new ConfirmTrade(activeTrade.tradeID,
        activeTrade.buyer.color,
        activeTrade.seller.color, activeTrade.price);
      activeTrade.buyer.send(ct);
      activeTrade.seller.send(ct);
      new CanelTradeIfNotConfirmed(activeTrade.tradeID).Schedule(3000, g);
    }
  }
}


class UpdateBids : AuctionEvent {
  public override void OnTimeElapsed(Player p, Game g) {
     g.UpdateBids(this); 
  }
  public int auctionType = -1;
  public UpdateBids(int auctionType) { this.auctionType = auctionType; }
}

partial class Game
{
  void DetermineHighestAndLowestBids(out int lowestSellPrice, out int highestBuyPrice)
  {
    lowestSellPrice = colony.res[auctionType] > 0 ? maxBid : SELL;
    highestBuyPrice = minBid == resPrice[auctionType] ? minBid : BUY;

    foreach (Player p in players)
    {
      if (p == colony) continue;
      if (p.buying)
        highestBuyPrice = Math.Max(highestBuyPrice, p.current);
      else
        lowestSellPrice = Math.Min(lowestSellPrice, p.current);
    }
  }


  // param is typically an UpdateBids object which is used to schedule next
  // iteration...  this is also called with a Player object when a bid change
  // is received during trading which immediately ends the trade...  In this
  // case, only that player is supposed to have active bid immediately moved
  public void UpdateBids(object param, bool init=false) // UpdateBids or Player
  {
    if (param is UpdateBids)
    {
      UpdateBids updBidsEvt = (UpdateBids)param;
      if (state != GameState.AUCTION ||
          auctionType != updBidsEvt.auctionType)
        return;  // this should effectively end the loop for updBidsEvt
    }

    DetermineHighestAndLowestBids(out int lowestSellPrice, out int highestBuyPrice);

    bidChangeThisCycle = false;

    foreach (Player p in players)
    {
      bool skip = param is Player && param != p;
      if (p.current < p.target && !skip)
      {
        if (p.current == BUY) 
          p.current = minBid;
        else if (p.target == p.current + bidIncrement)
          p.current += bidIncrement;
        else
          p.current += bidIncrement * 2;

        if (!p.buying && p.current > maxBid)
          p.current = SELL;

        if (p.buying && p.current > lowestSellPrice)
          p.current = lowestSellPrice;

        bidChangeThisCycle = true;
      }
      else if (p.current > p.target && !skip)
      {
        if (p.current == SELL) 
          p.current = maxBid;
        else if (p.target == p.current - bidIncrement)
          p.current -= bidIncrement;
        else
          p.current -= bidIncrement * 2;

        if (p.buying && p.current < minBid)
          p.current = BUY;

        if (!p.buying && p.current < highestBuyPrice)
          p.current = highestBuyPrice;

        bidChangeThisCycle = true;
      }

      if (p.buying && p.current > p.money) p.current = p.money >= minBid ? p.money : BUY;
      if (!p.buying && p.res[auctionType] <= 0) p.current = SELL;
    }

    DetermineHighestAndLowestBids(out lowestSellPrice, out highestBuyPrice);
    if (highestBuyPrice > lowestSellPrice )
    {
      highestBuyPrice = lowestSellPrice;
      foreach (Player p in players)
      {
        if (p == colony) continue;
        if (p.buying && p.current > highestBuyPrice)
          p.current = highestBuyPrice;
      }
    }

    if (highestBuyPrice > maxBid)
    {
      storeBuy = false;
      minBid += (highestBuyPrice - maxBid);
      maxBid = highestBuyPrice;
    }
    
    if (bidChangeThisCycle || param is Player || init)
      sendBids(lowestSellPrice, highestBuyPrice);

    if (auctionType == LAND)
      sendCurrentLeader(highestBuyPrice);
    else
      startNewTradeIfNeeded(lowestSellPrice, highestBuyPrice);

    if (param is UpdateBids)
    {
      UpdateBids updBidsEvt = (UpdateBids)param;
      if (!init && (activeTrade is null))
      {
        if (!bidChangeThisCycle)
          auctionTime -= 200;
        else 
          auctionTime -= 10;
      }

      send(new AuctionTime(auctionTime/5000.0));
      if (auctionTime > 0) 
      {
        Console.WriteLine($"auction time: {auctionTime}");
        updBidsEvt.Schedule(250, this);
      }
      else
      {
        if (auctionType == LAND)
        {
          state = GameState.LANDAUCTION;  // I don't know how this got set to normal auction...

          Player winner = sendCurrentLeader(highestBuyPrice);

          if (winner != colony)
          {
            PlayerColor? originalOwner = landlots[currentLotForAuction].owner;
            if (originalOwner != null)
            {
              foreach (Player p in players)
                if (p.color == originalOwner)
                  p.money += highestBuyPrice;
            }

            landlots[currentLotForAuction].owner = winner.color;
            winner.money -= highestBuyPrice;
          }

          send(new AuctionResult(winner != colony, 
                                 winner.color, winner.money,
                                 currentLotForAuction));
        }
        else
          send(new AuctionResult(false, PlayerColor.NONE, 0, new LandLotID(0,0)));

        Thread.Sleep(3000);

        if ((state != GameState.AUCTION && state != GameState.LANDAUCTION)
            || (auctionType != updBidsEvt.auctionType))
        return;  // this should effectively end the loop for updBidsEvt

        List<Player> contPlayers = new();

        foreach (Player p in players)
        {
          if (!continueRecvd.Contains(p.color))
            contPlayers.Add(p);
        }

        foreach (Player p in contPlayers)
          new Continue().OnRecv(p, this);
      }
    }
  }

  public void sendBids(int lowestSellPrice, int highestBuyPrice)
  {
    Bid[] curBids = new Bid[players.Count];

    for (int i=0; i<players.Count; i++)
    {
      Player p = players[i];
      curBids[i] = new Bid(p.color, p.current, p.buying);
    }

    send(new Bids(curBids, lowestSellPrice, highestBuyPrice, storeBuy, minBid));
  }

  public Player sendCurrentLeader(int highestBuyPrice)
  {
    if (highestBuyPrice == BUY)
    {
      send(new CurrentLeader(false, PlayerColor.NONE));
      return colony;
    }

    Player buyer = colony;
    foreach (Player p in players)
      if (p.buying && p.current == highestBuyPrice && p.rank > buyer.rank) 
        buyer = p; 
    send(new CurrentLeader(buyer.color != PlayerColor.COLONY, buyer.color));
    return buyer;
  }

  public void startNewTradeIfNeeded(int lowestSellPrice, int highestBuyPrice)
  {
    if (activeTrade is not null)
      return;

    if (lowestSellPrice == highestBuyPrice)
    {
      int price = lowestSellPrice;
      tradeID++;
      Player buyer = colony;
      foreach (Player p in players)
        if (p.buying && p.current == price && p.rank > buyer.rank) 
          buyer = p; 
      Player seller = colony;
      foreach (Player p in players)
        if (!p.buying && p.current == price && p.rank > seller.rank) 
          seller = p; 
      activeTrade = new(tradeID, buyer, seller, price, 1);
      send(new HighlightTrade(buyer.color, seller.color, price));
      new ConfirmTradeAfterDelay(activeTrade).Schedule(1000, this);
    }
  }
  
  public void StartAuction()
  {
    auctionTime = 5000;

    storeBuy = (auctionType < 4);
    
    foreach (var p in players)
    {
      if (p.buying)
      {
         p.target = BUY;
         p.current = BUY;
      }
      else
      {
        p.target = SELL;
        p.current = SELL;
      }
    }
    
    UpdateGameState(GameState.AUCTION);

    foreach (var p in players) 
    {
      p.criticalLevel = AmtResNeeded(p);
      send(new Res(p.color, p.res[auctionType], p.money, p.criticalLevel, 
                   Enum.GetName(typeof(ResourceType), auctionType) ?? ""));
    }

    UpdateBids(new UpdateBids(this.auctionType), true);  // starts 250 millisec loop
    
  }
}
