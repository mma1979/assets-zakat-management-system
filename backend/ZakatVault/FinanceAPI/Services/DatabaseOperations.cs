namespace FinanceAPI.Services;

public interface IDatabaseOperations
{
    void BackupDatabase();
    void GenerateMonthlyFinancialReports();
    void CleanUpOldTransactions();
}


public class DatabaseOperations: IDatabaseOperations
{
    public void BackupDatabase()
    {
        throw new NotImplementedException();
    }

    public void GenerateMonthlyFinancialReports()
    {
        throw new NotImplementedException();
    }

    public void CleanUpOldTransactions()
    {
        throw new NotImplementedException();
    }
}
