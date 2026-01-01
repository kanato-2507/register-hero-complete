import qrcode
url = "https://kanato-2507.github.io/register-hero-complete/"
img = qrcode.make(url)
img.save("qrcode_complete.png")
print("QR Code generated")
