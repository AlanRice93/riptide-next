defmodule Riptide.Subscribe do
  def watch(path), do: watch(path, self())

  def watch(path, pid) do
    group = group(path)

    cond do
      member?(group, pid) ->
        :ok

      true ->
        :pg2.join(group, pid)
    end
  end

  def member?(group, pid) do
    case :pg2.get_members(group) do
      {:error, {:no_such_group, _}} ->
        :pg2.create(group)
        false

      result ->
        pid in result
    end
  end

  # TODO: This could have a better implementation
  def broadcast_mutation(mut) do
    mut
    |> Riptide.Mutation.layers()
    |> Stream.flat_map(fn {path, value} ->
      Stream.concat([
        [{path, Riptide.Mutation.inflate(path, value)}],
        value.delete
        |> Stream.filter(fn {_, value} -> value === 1 end)
        |> Stream.map(fn {key, _} ->
          {path ++ [key], Riptide.Mutation.delete(path ++ [key])}
        end)
      ])
    end)
    |> Enum.each(fn {path, value} ->
      path
      |> group()
      |> :pg2.get_members()
      |> case do
        {:error, _} ->
          :skip

        members ->
          Enum.map(members, fn pid -> send(pid, {:mutation, value}) end)
      end
    end)
  end

  def group(path) do
    {__MODULE__, path}
  end
end
