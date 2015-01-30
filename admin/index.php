<!DOCTYPE html>
<html>
<head>
    <title>Admin</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link href="../css/style.css" rel="stylesheet" type="text/css"/>

</head>
<body>
<?php

    require_once("../generic.php");

    // split the user/pass parts
    list($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']) = explode(':', base64_decode(substr($_SERVER['HTTP_AUTHORIZATION'], 6)));

    if ($_SERVER['PHP_AUTH_USER'] == null) {
        header('WWW-Authenticate: Basic realm="Admin"');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Please authenticate';
        exit;
    } else {

        if (checkUser($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']) != false) {
            ?>
                <ul>
                <li><a href="UseSnomConnection.php">Verbinding met lokale SNOM telefoon in/uitschakelen</a></li>
                </ul>
            <?php
        } else {
            header('WWW-Authenticate: Basic realm="Admin"');
            header('HTTP/1.0 401 Unauthorized');
            echo 'Incorrect password';
            exit;
        }
    }

    ?>

</body>
</html>
