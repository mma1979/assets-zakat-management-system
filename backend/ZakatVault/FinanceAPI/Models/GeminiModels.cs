namespace FinanceAPI.Models;

#region Gemini Response
public class GeminiResponse
{
    public List<Candidate>? Candidates { get; set; }
}

public class Candidate
{
    public ResponseContent? Content { get; set; }
}

public class Part
{

}

public class TextPart : Part
{
    public required string Text { get; set; }
}


public class ResponseContent
{
    public required List<TextPart> Parts { get; set; }
}
#endregion