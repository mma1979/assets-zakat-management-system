namespace FinanceAPI.Services;

public interface IVapidKeyService
{
    string? GetPublicKey();
    string? GetPrivateKey();
}

public class VapidKeyService : IVapidKeyService
{
    private readonly string? _publicKey;
    private readonly string? _privateKey;

    public VapidKeyService(IConfiguration configuration)
    {
        _publicKey = configuration["Vapid:PublicKey"];
        _privateKey = configuration["Vapid:PrivateKey"];
    }

    public string? GetPublicKey() => _publicKey;
    public string? GetPrivateKey() => _privateKey;
}
