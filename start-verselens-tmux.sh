tmux new-session -d -s verselens -c /home/tun/project/verselens/app 'npx expo start --tunnel'
echo "VerseLens started in tmux session 'verselens'"
echo "To attach: tmux attach -t verselens"
echo "To detach: Ctrl+B then D"
echo "To kill session: tmux kill-session -t verselens"