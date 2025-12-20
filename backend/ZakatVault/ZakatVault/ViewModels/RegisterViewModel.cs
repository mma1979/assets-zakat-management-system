using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;

using ZakatVault.Services;

namespace ZakatVault.ViewModels;

public class RegisterViewModel : BindableObject
{
    private readonly AuthService _authService;
    private string _name;
    private string _email;
    private string _password;
    private string _message;
    private bool _isLoading;

    public string Name
    {
        get => _name;
        set { _name = value; OnPropertyChanged(); }
    }
    public string Email
    {
        get => _email;
        set { _email = value; OnPropertyChanged(); }
    }

    public string Password
    {
        get => _password;
        set { _password = value; OnPropertyChanged(); }
    }

    public string Message 
    {
        get => _message;
        set { _message = value; OnPropertyChanged(); }
    }

    public bool IsLoading 
    {
        get => _isLoading;
        set { _isLoading = value; OnPropertyChanged(); }
    }

    public ICommand LoginCommand { get; }
    public ICommand RegisterCommand { get; }

    public RegisterViewModel(AuthService authService)
    {
        _authService = authService;
        IsLoading = false;
        LoginCommand = new Command(OnLogin);
        RegisterCommand = new Command(OnRegister);
    }

    private async void OnLogin()
    {
        await Shell.Current.GoToAsync("..");
    }

    private async void OnRegister()
    {
        if (string.IsNullOrWhiteSpace(Email) ||string.IsNullOrWhiteSpace(Name) || string.IsNullOrWhiteSpace(Password))
        {
            Message = "Please enter your data";
            return;
        }

        IsLoading = false;
        Message = "";

        var result = await _authService.RegisterAsync(new Models.RegisterDto
        {
            Email = Email,
            Password = Password,
            Name = Name,
        });

        if (result.Success)
        {
            Name = "";
            Email = "";
            Password = "";
            await Shell.Current.GoToAsync("//Secure/DashboardPage");
        }
        else
        {
            Message = result.Message;
        }

        IsLoading = true;
    }

}
