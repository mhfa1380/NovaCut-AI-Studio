$regBytes = [IO.File]::ReadAllBytes("C:\Users\Mhfa1380\Desktop\adobepr\cep-plugin\fonts\YekanBakh-Regular.ttf")
$boldBytes = [IO.File]::ReadAllBytes("C:\Users\Mhfa1380\Desktop\adobepr\cep-plugin\fonts\YekanBakh-Bold.ttf")
$b64Reg = [Convert]::ToBase64String($regBytes)
$b64Bold = [Convert]::ToBase64String($boldBytes)

$template = [IO.File]::ReadAllText("C:\Users\Mhfa1380\Desktop\adobepr\scripts\showcase_template.html", [Text.Encoding]::UTF8)
$fontCss = @"
        @font-face {
            font-family: 'Yekan Bakh';
            src: url('data:font/truetype;charset=utf-8;base64,$b64Reg') format('truetype');
            font-weight: normal;
            font-style: normal;
            font-display: block;
        }
        @font-face {
            font-family: 'Yekan Bakh';
            src: url('data:font/truetype;charset=utf-8;base64,$b64Bold') format('truetype');
            font-weight: bold;
            font-style: normal;
            font-display: block;
        }
"@

$finalHtml = $template.Replace("/* __LOCAL_FONTS_PLACEHOLDER__ */", $fontCss)
[IO.File]::WriteAllText("C:\Users\Mhfa1380\Desktop\adobepr\scripts\showcase.html", $finalHtml, [Text.Encoding]::UTF8)
Write-Output "Successfully compiled showcase.html with embedded Yekan Bakh local fonts!"
