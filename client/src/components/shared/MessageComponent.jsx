import { Box, Typography } from '@mui/material';
import moment from 'moment';
import React from 'react'
import { fileFormat } from '../../lib/feautres';

const MessageComponent = ({message,user}) => {

    const {sender,content,attachments,createdAt} = message;

    const sameSender = sender._id == user._id;

    const timeAgo = moment(createdAt).fromNow()

  return (
    <div style={{
        alignSelf : sameSender ? "flex-end" : "flex-start",
        background:"white",
        color:"black",
        borderRadius:"5px",
        padding:'0.5rem',
        width:"fit-content "
    }}>
      {
        !sameSender && <Typography color={"#2694ab"} fontWeight={"600"} variant='caption'>{sender.name}</Typography>
      }
      {
        <>
         <Typography>{content}</Typography>
         </>
       
    }
    {
        attachments.length > 0 && attachments.map((attachment,idx) => {

            const url = attachment.url;
            const file = fileFormat(url);
            return <Box key={idx}>
                <a href="" target='_blank' download style={{color:"black"}}></a>
            </Box>
        })
    }


    <Typography variant='caption' color={"text.secondary"}>{timeAgo}</Typography>
      
    </div>
  )
}

export default MessageComponent
