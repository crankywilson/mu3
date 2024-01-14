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
  int month
) : Msg;
/*
def hmBuy(g:Game, p:Player, msg:dict):
  p.buying = True
  p.current = NOBID
  p.target = NOBID
  if g.state is GameState.AUCTION:
    g.sendBids()


def hmSell(g:Game, p:Player, msg:dict):
  p.buying = False
  p.current = NOASK
  p.target = NOASK
  if g.state is GameState.AUCTION:
    g.sendBids()


def hmTarget(g:Game, p:Player, msg:dict):
  p.target = msg["target"]
  g.updateBidsAfterDelay()
  if p is g.buyer and p.target < p.current:
    g.updateTradeStatus()
  elif p is g.seller and p.target > p.current:
    g.updateTradeStatus()


def hmTradeConfirmed(g:Game, p:Player, msg:dict):
  if g.activeTradeID == msg["tradeID"]:
    if g.buyer is p:
      g.buyerConfirmed = True
    elif g.seller is p:
      g.sellerConfirmed = True

    if g.buyerConfirmed and g.sellerConfirmed:
      g.TradeConfirmed()
  else:
    print(f"Trade ID mismatch: {g.activeTradeID} vs {msg['tradeID']}")


*/

static class AuctionConstants {
  public const int BUY = -2;
  public const int BUY1 = -1;
  public const int SELL = 9999;
  public const int SELL1 = 9998;
};


partial class Game
{
  public int tradeID = 0;
  public int auctionTime = 5000;
  public int minBid = 10;
  public int maxBid = 45;
  public bool buyerConfirmed = false;
  public bool sellerConfirmed = false;
  public bool tradingStarted = false;
  public Player? buyer = null;
  public Player? seller = null;

  public void DetermineNewBuyerSeller()
  {
  }
}

record ConfirmTrade (
  int tradeID
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
  if (origTadeID == tradeID && buyer is not null && seller is not null)
  {
    if (!buyerConfirmed)
    {
      buyer.current = BUY;
      buyer.target = buyer.current;
      send(new BuyerReset("No trade confirmation received", buyer.color, buyer.target, buyer.current));
      buyer = null;   
      cancelRequired = true; 
    }
    if (!sellerConfirmed)
    {
      seller.current = SELL;
      seller.target = seller.current;
      send(new SellerReset("No trade confirmation received", seller.color, seller.target, seller.current));
      seller = null;   
      cancelRequired = true; 
    }
    if (cancelRequired)
    {
      tradeID++;
      tradingStarted = false;
      DetermineNewBuyerSeller();
    }
  }
}}

class ConfirmTradeAfterDelay : AuctionEvent
{
  int tradeID;
  public ConfirmTradeAfterDelay(int tradeID) { this.tradeID = tradeID; }
  public override void OnTimeElapsed(Player p, Game g) {
    if (tradeID == g.tradeID && g.buyer is not null && g.seller is not null)
    {
      g.buyerConfirmed = false;
      g.sellerConfirmed = false;
      g.buyer.send(new ConfirmTrade(tradeID));
      g.seller.send(new ConfirmTrade(tradeID));
      new CanelTradeIfNotConfirmed(tradeID).Schedule(5000, g);
    }
  }
}

/*
  def confirmTradeAfterDelay(self, secs : float):
    if self.tradeTask is not None:
      print("Cancelling previous trade task")
      self.tradeTask.cancel()
    self.activeTradeID += 1
    self.tradeTask = create_task(self.confirmTrade(secs, self.activeTradeID))


  async def confirmTrade(self, secs : float, activeTradeID):
    if activeTradeID != self.activeTradeID:
      print("Trade appears to be cancelled.")
      #self.tradeTask = None                                
      return
    await sleep(secs)                                       #@IgnoreException
    if activeTradeID != self.activeTradeID:
      print("Trade appears to be cancelled.")
      #self.tradeTask = None                                If this task got canceled, we shoudn't undo the newer active task that replaced this
      return
    #if self.buyer.ws is None or self.seller.ws is None:    Let's say if we don't get confirmation for any reason,
    #  print("WS inactive - can't trade")                     then we'll push whoever didn't confirm back to buy or sell
    #  #self.tradeTask = None
    #  return

    self.buyerConfirmed = False if self.buyer is not self.store else True
    self.sellerConfirmed = False if self.seller is not self.store else True
    confirmSpecs = {"msg": "ConfirmTrade",
                    "buyer": self.buyer.character,
                    "seller": self.seller.character,
                    "price": self.activeTradePrice,
                    "tradeID": self.activeTradeID} 
    self.send("ConfirmTrade", confirmSpecs, self.buyer)
    self.send("ConfirmTrade", confirmSpecs, self.seller)

    if self.confirmTimeoutTask is not None:
      self.confirmTimeoutTask.cancel()
    self.confirmTimeoutTask = create_task(self.cancelTradeIfNoConfirm())
    
    self.tradeTask = None


  async def cancelTradeIfNoConfirm(self):
    activeTradeID = self.activeTradeID
    await sleep(5)                                     #@IgnoreException
    if activeTradeID != self.activeTradeID:
      print("Confirm check on different trade ID")
      self.confirmTimeoutTask = None
      return

    if not self.buyerConfirmed:
      pass
      # move buyer back to pass
    if not self.sellerConfirmed:
      pass
      # move seller back to out

    self.confirmTimeoutTask = None
    return


  def TradeConfirmed(self):
    if self.confirmTimeoutTask is not None:
      self.confirmTimeoutTask.cancel()
    self.buyer.money -= self.seller.current
    self.seller.money += self.buyer.current
    self.buyer.resources[self.auctionType.value] += 1
    self.seller.resources[self.auctionType.value] -= 1
    
    self.unitsTraded += 1
    self.send("UnitsTraded", {"units": self.unitsTraded, 
      "money": {self.buyer.character: self.buyer.money, self.seller.character: self.seller.money},
      "res":   {self.buyer.character: self.buyer.resources[self.auctionType.value], 
                self.seller.character: self.seller.resources[self.auctionType.value]}
    })

    doUpdateTrade = False

    if self.buyer.money < self.activeTradePrice:
      self.buyer.target = NOBID
      self.buyer.current = NOBID
      self.send("UpdMsg", {"txt":"Buyer can't afford any more"})
      doUpdateTrade = True

    if self.seller.resources[self.auctionType.value] == 0:
      self.seller.target = NOASK
      self.seller.current = NOASK
      if self.seller is not self.store:
        self.send("UpdMsg", {"txt":"Seller out of resources to trade"})
      else:
        self.send("StoreOut")
      doUpdateTrade = True

    elif self.seller.resources[self.auctionType.value] == self.seller.criticalLevel:
      if self.seller is not self.store:
        self.seller.target = NOASK
        self.seller.current = NOASK
        self.send("UpdMsg", {"txt":"Seller at critical level"})
        doUpdateTrade = True    

    if doUpdateTrade:
      self.updateTradeStatus()

    else:
      delay = 1.1 - (self.unitsTraded / 10.0)
      if delay < .15:
        delay = .15
      self.confirmTradeAfterDelay(delay)


  def updateBidsAfterDelay(self):
    if self.bidTask is None:
      self.bidTask = create_task(self.updateBids())


  # lets move a maximum of 2 every .25 seconds
  async def updateBids(self):
    while self.anyBidsToUpdate():
      await sleep(.25)                            #@IgnoreException
      lowestSellPrice = self.lowestSellPrice()
      highestBuyPrice = self.highestBuyPrice()

      for p in self.players:

        if p.current < p.target:
          if p.current == NOBID:
            p.current = self.minBid
          elif p.target == p.current + self.bidIncrement:
            p.current += self.bidIncrement
          else:
            p.current += (self.bidIncrement * 2)

          if p.buying and p.current > lowestSellPrice:
            p.current = lowestSellPrice

          if not p.buying and p.current > self.maxBid():
            p.current = NOASK
            
        elif p.current > p.target:
          if p.current == NOASK:
            p.current = self.maxBid()
          elif p.target == p.current - self.bidIncrement:
            p.current -= self.bidIncrement
          else:
            p.current -= (self.bidIncrement * 2)

          if not p.buying and p.current < highestBuyPrice:
            p.current = highestBuyPrice

          if p.buying and p.current < self.minBid:
            p.current = NOBID

        if p.buying and p.current > p.money:
          p.current = p.money
          if p.current < self.minBid:
            p.current = NOBID
          p.target = p.current  
        
        if p.buying and p.current > self.maxBid():
            self.minBid += p.current - self.maxBid()

        if not p.buying and p.resources[self.auctionType.value] <= 0:
          p.current = NOASK
          p.target = NOASK

      # end loop, next player...
      
      self.sendBids()

      self.updateTradeStatus()

    self.bidTask = None


  def updateTradeStatus(self):
    prevBuyer = self.buyer
    prevSeller = self.seller

    if self.buyer is not NOPLAYER and self.buyer:
      if self.buyer.target < self.activeTradePrice:
        self.send("EndTrade")
        if self.confirmTimeoutTask is not None:
          self.confirmTimeoutTask.cancel()
          self.confirmTimeoutTask = None
        self.buyer.current -= self.bidIncrement
        if self.buyer.current < self.minBid:
          self.buyer.current = NOBID
        self.sendBids()
        self.buyer = NOPLAYER
    
    if self.seller is not NOPLAYER and self.seller:
      if self.seller.target > self.activeTradePrice:
        self.send("EndTrade")
        if self.confirmTimeoutTask is not None:
          self.confirmTimeoutTask.cancel()
          self.confirmTimeoutTask = None
        self.seller.current += self.bidIncrement
        if self.seller.current > self.maxBid():
          self.seller.current = NOASK
        self.sendBids()
        self.seller = NOPLAYER
        
    if self.buyer is NOPLAYER or self.seller is NOPLAYER:
      sellPrice = self.lowestSellPrice()
      buyPrice = self.highestBuyPrice()
      if sellPrice == buyPrice:
        if self.buyer is NOPLAYER or self.buyer is self.store:
          for p in self.players:
            if p.buying and p.current == buyPrice:
              self.buyer = p
              break
        if self.buyer is NOPLAYER and buyPrice == self.resourcePrices[self.auctionType.value]:
          self.buyer = self.store
          self.store.current = buyPrice
        if self.buyer is NOPLAYER:
          raise Exception("No Buyer at buyPrice?")

        if self.seller is NOPLAYER or self.buyer is self.store:
          for p in self.players:
            if not p.buying and p.current == sellPrice:
              self.seller = p
              break
        if self.seller is NOPLAYER and self.potentialStoreSale(sellPrice):
          self.seller = self.store
          self.store.current = sellPrice
        if self.seller is NOPLAYER:
          raise Exception("No Seller at sellPrice?")

    if self.buyer is prevBuyer and self.seller is prevSeller:
      return   # don't start new trade here

    if self.buyer is not NOPLAYER and self.seller is not NOPLAYER:
      self.unitsTraded = 0
      if self.buyer.current != self.seller.current:
        raise Exception("traders' current prices differ!")
      self.activeTradePrice = self.buyer.current
      self.send("BeginTrade", {"buyer":self.buyer.character, "seller":self.seller.character})
      self.confirmTradeAfterDelay(1.3)
    else:
      self.buyer = NOPLAYER
      self.seller = NOPLAYER
      self.activeTradePrice = 0
      self.activeTradeID += 1


  def potentialStoreSale(self, sellPrice : int):
    if self.bidIncrement > 1:
      return False  # store only sells first 3 resources
    if self.store.resources[self.auctionType.value] < 1:
      return False
    return sellPrice == self.resourcePrices[self.auctionType.value] + 35


  def handleLandAuctionResult(self):
    self.buyer = NOPLAYER
    buyPrice = self.highestBuyPrice()
    for p in self.players:
      if p.current == buyPrice:
        self.buyer = p
        break

    if self.buyer is not NOPLAYER:
      self.plots[self.auctionPlotKey].owner = self.buyer
      self.buyer.money -= self.buyer.current
      self.prevLandAuctionSalePrice = self.buyer.current
    else:
      self.prevLandAuctionSalePrice = self.minBid - 40
      if self.prevLandAuctionSalePrice < 160:
        self.prevLandAuctionSalePrice = 160
    self.auctionType = Res.UNDEF
    self.send('Plots', {'plots':  self.plotStates()})
    self.send('LandAuctionWinner', {'char': self.buyer.character, 'price': self.buyer.current, 'money':self.buyer.money})


  def maxBid(self):
    return 35 * self.bidIncrement + self.minBid


  def lowestSellPrice(self):
    pr = NOASK
    for p in self.players:
      if not p.buying and p.current < pr:
        pr = p.current

    if pr == NOASK and self.store.resources[self.auctionType.value] > 0:
      pr = self.maxBid()

    return pr


  def highestBuyPrice(self):
    pr = NOBID
    for p in self.players:
      if p.buying and p.current > pr:
        pr = p.current

    if pr == NOBID and self.minBid == self.resourcePrices[self.auctionType.value]:
      return self.minBid

    return pr


  def anyBidsToUpdate(self):
    for p in self.players:
      if p.current != p.target:
        return True
    return False


  def sendBids(self):
    currentBids = {}
    buying = {}
    for p in self.players:
      currentBids[p.character] = p.current
      buying[p.character] = p.buying
    self.send("Bids", {"current":currentBids, "buying":buying,
                       "lowestSellPrice": self.lowestSellPrice(),
                       "highestBuyPrice": self.highestBuyPrice(),
                       "storeBuy": (self.minBid == self.resourcePrices[self.auctionType.value]
                                    and self.auctionType != Res.LAND),
                       "minBid": self.minBid})
*/
