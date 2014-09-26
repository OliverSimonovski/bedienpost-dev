<?php

    function checkRestAuth($username, $server, $auth) {
            $restServer = str_replace("uc.", "rest.", $server);
            $url = "https://".$restServer."/user";
            $authHeader = "Authorization: Basic " . $auth;

            $ch = curl_init();
            $timeout = 5; // set to zero for no timeout

            curl_setopt ($ch, CURLOPT_URL, $url);
            curl_setopt ($ch, CURLOPT_HTTPHEADER, array($authHeader,  "X-No-Redirect: true"));
            curl_setopt ($ch, CURLOPT_RETURNTRANSFER, 1);
            curl_setopt ($ch, CURLOPT_CONNECTTIMEOUT, $timeout);

            $result = curl_exec($ch);

            return $result;
    }

    $SQLUSER = "bedien01_main";
    $SQLPASS = "S4sHmqxqIU";

    $db = new mysqli("localhost", $SQLUSER, $SQLPASS, "bedien01_main");

    header('Access-Control-Allow-Origin: *');
?>