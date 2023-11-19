using System.Text.Json.Serialization;

record struct PropID(int e, int n)
{
 public string str()
 {
    string ret="";
    if (e < 0) ret += "W" + (-e).ToString();
    else ret += "E" + e.ToString();
    if (n < 0) ret += "S" + (-n).ToString();
    else ret += "N" + n.ToString();
    return ret;
 }
 public static string Str(int e, int n)
 {
    return new PropID(e,n).str();
 }
}

class Prop
{
  [JsonInclude] public Player?  owner;
  [JsonInclude] public int      mts;
  [JsonInclude] public int      crys;
  [JsonInclude] public int      res = -1;
  [JsonInclude] public int      resprod;
}
