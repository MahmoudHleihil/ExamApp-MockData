import axios from "axios";

export async function sendMessage(
    message
) {

    const response =
        await axios.post(

            "/api/chat",

            { message },

            {
                withCredentials: true
            }

        );

    return response.data.message;

}