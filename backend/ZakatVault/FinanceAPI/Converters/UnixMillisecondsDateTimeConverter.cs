namespace FinanceAPI.Converters;

using System.Text.Json;
using System.Text.Json.Serialization;

public class UnixMillisecondsDateTimeConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader,
                                  Type typeToConvert,
                                  JsonSerializerOptions options)
    {
        var ms = reader.GetInt64();
        return DateTimeOffset.FromUnixTimeMilliseconds(ms).UtcDateTime;
    }

    public override void Write(Utf8JsonWriter writer,
                               DateTime value,
                               JsonSerializerOptions options)
    {
        var ms = new DateTimeOffset(value.ToUniversalTime())
                     .ToUnixTimeMilliseconds();
        writer.WriteNumberValue(ms);
    }
}
