using System.Text.Json;
using System.Text.Json.Serialization;

[JsonConverter(typeof(LandLotIDJsonConverter))]
record struct LandLotID(int e, int n)
{
 public string str()
 {
   string ret="";
   if (e < 0) ret += "W" + (-e).ToString();
   else if (e == 0) ret += "R" + e.ToString();
   else ret += "E" + e.ToString();
   if (n < 0) ret += "S" + (-n).ToString();
   else ret += "N" + n.ToString();
   return ret;
 }
 public static LandLotID FromString(string s)
 {
   int e = Convert.ToInt32(s[1]);
   int n = Convert.ToInt32(s[3]);
   if (s[0] == 'W') e = -e;
   if (s[0] == 'S') n = -n;
   return new LandLotID(e, n);
 }
 public static string Str(int e, int n)
 {
   return new LandLotID(e,n).str();
 }
}

class LandLotIDJsonConverter : JsonConverter<LandLotID>
{
   public override void Write(Utf8JsonWriter writer, LandLotID val, JsonSerializerOptions options)
   { writer.WriteStringValue(val.str()); }

   public override void WriteAsPropertyName(Utf8JsonWriter writer, LandLotID val, JsonSerializerOptions options)
   { writer.WritePropertyName(val.str()); }

   public override LandLotID Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
   { return LandLotID.FromString(reader.GetString()??"0000"); }

   public override LandLotID ReadAsPropertyName (ref System.Text.Json.Utf8JsonReader reader, Type typeToConvert, System.Text.Json.JsonSerializerOptions options)
   { return LandLotID.FromString(reader.GetString()??"0000"); }
}

class LandLot
{
  [JsonInclude] public Player?  owner;
  [JsonInclude] public int      mts;
  [JsonInclude] public int      crys;
  [JsonInclude] public int      res = -1;
  [JsonInclude] public int      resprod;
  public void shutupwarnings() { owner = new(); mts = 3; crys = 5; resprod = 7; }  // delete this
}

class LandLotDict : Dictionary<LandLotID, LandLot> {}

