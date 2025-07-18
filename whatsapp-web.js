client.on('ready', async () => {
    const chats = await client.getChats();
    chats.forEach(chat => {
      if (chat.isGroup) {
        console.log(`📛 Nome: ${chat.name}`);
        console.log(`🆔 ID: ${chat.id._serialized}`);
      }
    });
  });
  