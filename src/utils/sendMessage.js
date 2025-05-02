const sendMessage = async () => {
    const api = await SmsApi.findOne().select("apiUrl apiKey senderId channel dcs");
    if (!api) {
        return res.status(500).json(new APIResponse(500, {}, "Something went wrong whil"));
    }
    const templeteData = await Templete.findOne({ templeteName: 'otp' });
    if (!templeteData) {
        return res.status(500).json(new APIResponse(500, {}, "Something went wrong while Sending OTP"));
    }
    const message = templeteData.templete.replace("${otp}", otp);
    const params = new URLSearchParams({
        apiKey: api.apiKey,
        senderid: api.senderId,
        channel: api.channel,
        DCS: api.dcs,
        flashsms: "0",
        number: mobile,

    });

    const fullUrl = `${api.apiUrl}?${params.toString()}&text:${message}`;
    console.log(fullUrl);
}