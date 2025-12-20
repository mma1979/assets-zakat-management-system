using System;
using System.Collections.Generic;
using System.Text;
using System.Windows.Input;

using ZakatVault.Pages;
using ZakatVault.Services;

namespace ZakatVault.ViewModels;

public class LoginViewModel : BindableObject
{
    private readonly AuthService _authService;
    private string _username;
    private string _password;
    private string _message;
    private bool _isLoading;

    public string Username
    {
        get => _username;
        set { _username = value; OnPropertyChanged(); }
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

    public LoginViewModel(AuthService authService)
    {
        _authService = authService;
        IsLoading = true;
        LoginCommand = new Command(OnLogin);
        RegisterCommand = new Command(OnRegister);
    }

    private async void OnLogin()
    {
        if (string.IsNullOrWhiteSpace(Username) || string.IsNullOrWhiteSpace(Password))
        {
            Message = "Please enter username and password";
            return;
        }

        IsLoading = false;
        Message = "";

        var result = await _authService.LoginAsync(new Models.LoginDto
        {
            Email = Username,
            Password = Password
        });

        if (result.Success)
        {
            Username = "";
            Password = "";
            await Shell.Current.GoToAsync("//Secure/DashboardPage");
        }
        else
        {
            Message = result.Message;
        }

        IsLoading = true;
    }

    private async void OnRegister() {
        await Shell.Current.GoToAsync(nameof(RegisterPage));
    }
}