import React from 'react'
import * as ReactDOM from 'react-dom'
import * as Riptide from '@ironbay/riptide'
import './App.css'

// Create a connection to the remote server
const connection = Riptide.Connection.create()
connection.transport.connect('ws://localhost:12000/socket')

// Represents the remote store on the server
const remote = new Riptide.Store.Remote(connection)
// Represents local store for the current session
const local = new Riptide.Store.Memory()
// Setup local store to sync with remote.
// Returns a sync object that can be used to apply mutations both to local and remote
const sync = local.sync(remote)

// Log entire state when local store updates
local.onChange.add(mut => {
    console.dir('Mutation', mut)
    console.dir('Local', local.query_path([]))

})

// When the connection status changes, save the state just to the local store
connection.transport.onStatus.add(status => local.merge(['connection', 'status'], status))

// Create interceptor to fetch creatures whenever connection becomes ready
local.interceptor.before_mutation(['connection'], async (mut) => {
    if (mut.merge.status !== 'ready') return

    // Refresh creatures path from remote and subscribe to any future changes
    await remote.query({
        'creatures': {
            subscribe: true
        }
    })
})

interface Creature {
    name?: string
    key?: string
    created?: number
    completed?: boolean
}

function App() {
    // Tell React to rerender the application when there's a change to the local store
    const [_, render] = React.useState(0)
    React.useEffect(() => {
        local.onChange.add(() => render(val => val + 1))
    }, [])

    async function create_creature() {
        const name = prompt('Name of new creature?')
        if (!name) return
        const key = Riptide.UUID.ascending()
        try {
            await sync.merge(['creatures', key], {
                key,
                name
            })
        } catch (ex) {
            alert(ex)
            await local.delete(['creatures', key])
        }
    }

    async function todo_complete(e, key) {
        console.dir(e.target.checked)
        const completed = e.target.checked ? true : false
        await sync.merge(['creatures', key, 'completed'], completed)
    }

    async function todo_delete(key) {
        await sync.delete(['creatures', key])
    }

    return (
        <div>
            {
                local
                    .query_values<Creature>(['creatures'])
                    .map(todo => {
                        return (
                            <div key={todo.key}>
                                <input type="checkbox" checked={todo.completed} onChange={(e) => todo_complete(e, todo.key)} />
                                <span className={todo.completed ? "line-through" : ""}>{todo.name} - {todo.created && `Created ${new Date(todo.created).toLocaleTimeString()}`}</span>
                                <span onClick={async () => await todo_delete(todo.key)}>&nbsp;X</span>
                            </div>
                        )
                    })
            }
            <button onClick={create_creature}>Create New</button>
        </div>
    )
}

ReactDOM.render(<App />, document.querySelector('.root'))