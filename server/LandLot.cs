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
   if (s[2] == 'S') n = -n;
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
  [JsonInclude] public Player?      owner     = null;
  [JsonInclude] public int          mNum      = 0;        // number of mounds
  [JsonInclude] public List<float>  mg        = new();    // mound Geometry
                public int          crys      = 0;        // crystite level
  [JsonInclude] public int          res       = -1;       // resource being produced
                public int          resprod   = 0;        // production amount for this month
}

class LandLotDict : Dictionary<LandLotID, LandLot> {}

