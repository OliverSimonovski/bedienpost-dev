<?php
    require_once("../generic.php");
    require_once("lib/vCard.php");

    $contents = null;
    if ($_FILES['uploadedfile']['error'] == UPLOAD_ERR_OK               //checks for errors
          && is_uploaded_file($_FILES['uploadedfile']['tmp_name'])) { //checks that file is uploaded
      $uploadedFileContents = file_get_contents($_FILES['uploadedfile']['tmp_name']);
    }

    if ($uploadedFileContents == null) {
        header('HTTP/1.0 400 Bad Request - File upload failed.');
        exit;
    }

    $vCard = new vCard(false, $uploadedFileContents);
    foreach ($vCard as $vCardPart)
    {
        print_r($vCardPart);
        print_r($vCardPart -> n);
        print_r($vCardPart -> tel);
    }
?>