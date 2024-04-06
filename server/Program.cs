
using System.Collections.Concurrent;
using System.Net;

HttpListener listener = new();

listener.Prefixes.Add("http://*:8001/");

listener.Start();

using BlockingCollection<ReceivedMsg> preGameQ = new();
WSockHandler.preGameQ = preGameQ;

WSockHandler.httpListener = listener;
_ = Task.Run(WSockHandler.AcceptConnections);


DDebug.Start();

Console.WriteLine("listening on " + listener.Prefixes.ElementAt(0));
while (listener.IsListening)
{
  var qitem = preGameQ.Take();
  qitem.msg.OnPreGameRecv(qitem.p);
}

listener.Close();



