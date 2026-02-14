import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import './style.css';

function App() {
    const [tasks, setTasks] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(true);

    // Fetch tasks on mount
    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .order('id', { ascending: true });

        if (error) {
            console.error('Error fetching tasks:', error);
        } else {
            setTasks(data || []);
        }
        setLoading(false);
    };

    const addTask = async (e) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const newTask = {
            text: inputValue,
            completed: false
        };

        const { data, error } = await supabase
            .from('tasks')
            .insert([newTask])
            .select();

        if (error) {
            console.error('Error adding task:', error);
        } else if (data) {
            setTasks([...tasks, data[0]]);
            setInputValue('');
        }
    };

    const toggleTask = async (id, currentStatus) => {
        const { error } = await supabase
            .from('tasks')
            .update({ completed: !currentStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating task:', error);
        } else {
            setTasks(tasks.map(task =>
                task.id === id ? { ...task, completed: !currentStatus } : task
            ));
        }
    };

    const deleteTask = async (id) => {
        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting task:', error);
        } else {
            setTasks(tasks.filter(task => task.id !== id));
        }
    };

    return (
        <div className="container">
            <div className="node-card">
                <h1>AVON SCANNER</h1>
                <p>Industrialization status: {loading ? 'Syncing...' : 'Connected to Supabase'}</p>

                <form onSubmit={addTask} style={{ marginBottom: '2rem', display: 'flex', gap: '10px' }}>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Enter new task..."
                        style={{
                            flex: 1,
                            padding: '0.8rem 1.5rem',
                            borderRadius: '50px',
                            border: '1px solid var(--glass-border)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '1rem',
                            outline: 'none'
                        }}
                    />
                    <button type="submit" className="btn-velocity" style={{ padding: '0.8rem 2rem' }}>
                        ADD
                    </button>
                </form>

                <div className="task-list" style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {tasks.map(task => (
                        <div
                            key={task.id}
                            className="status-item"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                opacity: task.completed ? 0.6 : 1,
                                borderLeft: task.completed ? '4px solid #4ade80' : '4px solid var(--accent-neon)'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id, task.completed)}
                                    style={{ cursor: 'pointer', width: '20px', height: '20px' }}
                                />
                                <span style={{
                                    fontSize: '1.1rem',
                                    textDecoration: task.completed ? 'line-through' : 'none'
                                }}>
                                    {task.text}
                                </span>
                            </div>
                            <button
                                onClick={() => deleteTask(task.id)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--accent-pink)',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}
                            >
                                DELETE
                            </button>
                        </div>
                    ))}
                    {!loading && tasks.length === 0 && (
                        <p style={{ textAlign: 'center', opacity: 0.5 }}>No active nodes in queue.</p>
                    )}
                </div>

                <div className="status-grid" style={{ marginTop: '2rem' }}>
                    <div className="status-item">
                        <span className="status-label">Supabase Node</span>
                        <span className="status-value" style={{ fontSize: '0.8rem' }}>pilohhruno...</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Active</span>
                        <span className="status-value">{tasks.filter(t => !t.completed).length}</span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Synced</span>
                        <span className="status-value">{tasks.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
