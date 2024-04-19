<?php
if(isset($_POST['login'])) {

    $username = $_POST['username'];
    $password = $_POST['password'];


    $url = "https://localhost:7125/api/User/Login";


    $loginInfo = array(
        'username' => $username,
        'password' => $password
    );


    $postData = json_encode($loginInfo);


    $headers = array(
        'Content-Type: application/json'
    );

   
    $contextOptions = array(
        "ssl" => array(
            "verify_peer" => false,
            "verify_peer_name" => false
        )
    );

    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => implode("\r\n", $headers),
            'content' => $postData
        ],
        'ssl' => $contextOptions['ssl']
    ]);


    $response = @file_get_contents($url, false, $context);


    if ($response !== false) {
    
        $responseHeaders = $http_response_header;

        
        if ($responseHeaders[0] === "HTTP/1.1 200 OK") {
      
            echo "<script>alert('User Login successful.'); window.location.href = '../Homepage/clientHomepage.html';</script>";
            exit;
        } elseif ($responseHeaders[0] === "HTTP/1.1 401 Unauthorized") {
           
            echo "<script>alert('Invalid username or password.'); window.location.href = 'Login.html';</script>";
        } else {
         
            echo "<script>alert('Failed to log in. Please try again later.');</script>";
            header("Location: Login.html");
        }
    } else {
   
        echo "<script>alert('Invalid username or password.'); window.location.href = 'Login.html';</script>";
    }
}
?>
