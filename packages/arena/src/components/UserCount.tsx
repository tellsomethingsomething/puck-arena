interface UserCountProps {
  count: number;
  connected: boolean;
}

export function UserCount({ count, connected }: UserCountProps) {
  if (!connected) {
    return (
      <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-900/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-red-500/50">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-red-200 text-sm font-medium">
          Reconnecting...
        </span>
      </div>
    );
  }

  return (
    <div className="absolute top-4 left-4 flex items-center gap-2 bg-slate-800/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-slate-700/50">
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      <span className="text-slate-300 text-sm font-medium">
        {count} {count === 1 ? 'user' : 'users'} online
      </span>
    </div>
  );
}
