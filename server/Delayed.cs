class DelayedEvent
{
  Task? t;
  CancellationTokenSource? cts;
  int milliseconds;
  Player? p;

  public bool Schedule(int milliseconds, Player p)
  {
    if (p.pendingEvents.ContainsKey(GetType()))
    {
      Console.WriteLine($"Trying to schedule an already scheduled event type ({GetType().Name})");
      return false;
    }

    cts = new CancellationTokenSource();
    this.milliseconds = milliseconds;
    this.p = p;
    t = Task.Run(DelayThenQueue, cts.Token);
    p.pendingEvents[GetType()] = this;
    return true;
  }

  public void Cancel()
  {
    cts?.Cancel();
    p?.pendingEvents.Remove(GetType());
  }

  public bool Canceled()
  {
    return cts != null && cts.IsCancellationRequested;
  }

  async void DelayThenQueue()
  {
    await Task.Delay(milliseconds);
    if (p != null && p.game != null && cts != null && !cts.IsCancellationRequested)
    {
      // queue this to run on game message channel (sequentially with other messages at first opportunity)
      await p.game.channel.Writer.WriteAsync(new ReceivedMsg(p, new DoDelayedEvent(this)));
    }
  }

  public virtual void OnTimeElapsed(Player p, Game g) { }  // ovveride this
}

record DoDelayedEvent(DelayedEvent e) : Msg
{
  public override void OnRecv(Player p, Game g)
  {
    if (!e.Canceled())
    {
      e.OnTimeElapsed(p, g);
    }
    p.pendingEvents.Remove(e.GetType());
  }
}

class AcutionOver : DelayedEvent { 
  public override void OnTimeElapsed(Player p, Game g) {
    // schedule this with g.colony 'player'
  }
}

class ImprovementTimeUp : DelayedEvent { 
  public override void OnTimeElapsed(Player p, Game g) {
    ;
  }
}
