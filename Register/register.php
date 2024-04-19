<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $password = $_POST["password"];
    $confirmPassword = $_POST["confirm_password"];
    $nic = $_POST["nic"];


    if (empty($username) || empty($password) || empty($confirmPassword) || empty($nic)) {
        echo "<script>alert('Please fill in all fields.');</script>";
        exit;
    }
    if ($password !== $confirmPassword) {
        echo "<script>alert('Password and confirm password do not match.');</script>";
        exit;
    }


    $apiUrl = "https://localhost:7125/api/User/IsNICRegistered/" . $nic;
    $contextOptions = array(
        "ssl" => array(
            "verify_peer" => false,
            "verify_peer_name" => false
        )
    );


    $context = stream_context_create($contextOptions);


    $response = @file_get_contents($apiUrl, false, $context);

    if ($response === false) {
        echo "<script>alert('Failed to check NIC registration status.');</script>";
        exit;
    }

    $isRegistered = json_decode($response, true);

    if ($isRegistered === false) {

        $url = "https://localhost:7125/api/User";
        $data = json_encode(array(
            'username' => $username,
            'nic' => $nic,
            'password' => $password
        ));


        $curl = curl_init();


        curl_setopt($curl, CURLOPT_URL, $url);
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_HTTPHEADER, array('Content-Type: application/json'));


        curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
        $result = curl_exec($curl);
        curl_close($curl);

        if ($result === false) {
            echo "<script>alert('Failed to add user.');</script>";
            exit;
            echo "<script>alert('User added successfully.'); window.location.href = '../Homepage/clientHomepage.html';</script>";
        } elseif ($isRegistered) {
            echo "<script>alert('NIC already exists. Please choose a different NIC.');window.location.href = '../Register/Regiser.html.php';</script>";
            exit;
        } else {
            echo "<script>alert('Failed to check NIC registration status.');window.location.href = '../Register/Regiser.html.php';</script>";
            exit;
        }
    }
}
