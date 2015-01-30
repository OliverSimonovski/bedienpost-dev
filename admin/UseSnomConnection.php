<!DOCTYPE html>
<html>
<head>
    <title>Verbinding met VoIP telefoon.</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <link href="../css/style.css" rel="stylesheet" type="text/css"/>

</head>
<body>
<?php

    require_once("../generic.php");

    // split the user/pass parts
    list($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']) = explode(':', base64_decode(substr($_SERVER['HTTP_AUTHORIZATION'], 6)));

    if ($_SERVER['PHP_AUTH_USER'] == null) {
        header('WWW-Authenticate: Basic realm="Verbinding met VoIP telefoon."');
        header('HTTP/1.0 401 Unauthorized');
        echo 'Please authenticate';
        exit;
    } else {

        if (checkUser($_SERVER['PHP_AUTH_USER'], $_SERVER['PHP_AUTH_PW']) != false) {
            ?>
           <form method="post" action="StoreSnomConnection.php">
               Gebruik verbinding met telefoon om doorschakelingen te kunnen doen.<br/>
               (Werkt vooralsnog alleen op SNOM 320 of SNOM 710)<br/><br/>
               Ingeschakeld: <input name="ingeschakeld" type="checkbox" defaultChecked="false"> <br/><br/>

               <!--
               Username: <input name="username" type="text" /><br />
               Server: <input name="server" type="text" /><br />
               phoneIp: <input name="phoneIp" type="text" /><br />
               phoneUser: <input name="phoneUser" type="text" /><br />
               phonePass: <input name="phonePass" type="text" /><br />
               companyName: <select name="companyName">
               <option>SpeakUp</option>
               <option>VTel</option>
           </select><br /> -->


               <input type="submit" />
           </form>
            <?php
        } else {
            header('WWW-Authenticate: Basic realm="Verbinding met VoIP telefoon."');
            header('HTTP/1.0 401 Unauthorized');
            echo 'Incorrect password';
            exit;
        }
    }

    ?>

</body>
</html>