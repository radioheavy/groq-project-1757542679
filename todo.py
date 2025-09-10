#!/usr/bin/env python3

import os
import sys

TASKS_FILE = "tasks.txt"

def load_tasks():
    """Load tasks from file, return list of (task, completed) tuples."""
    if not os.path.exists(TASKS_FILE):
        return []
    
    tasks = []
    try:
        with open(TASKS_FILE, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('[x] '):
                    tasks.append((line[4:], True))
                elif line.startswith('[ ] '):
                    tasks.append((line[4:], False))
                elif line:
                    tasks.append((line, False))
    except IOError as e:
        print(f"Error reading tasks file: {e}")
    
    return tasks

def save_tasks(tasks):
    """Save tasks to file."""
    try:
        with open(TASKS_FILE, 'w') as f:
            for task, completed in tasks:
                status = "[x]" if completed else "[ ]"
                f.write(f"{status} {task}\n")
    except IOError as e:
        print(f"Error saving tasks: {e}")

def add_task(task_text):
    """Add a new task."""
    if not task_text.strip():
        print("Error: Task cannot be empty")
        return
    
    tasks = load_tasks()
    tasks.append((task_text.strip(), False))
    save_tasks(tasks)
    print(f"Added task: {task_text.strip()}")

def list_tasks():
    """Display all tasks with numbers and completion status."""
    tasks = load_tasks()
    
    if not tasks:
        print("No tasks found.")
        return
    
    print("Tasks:")
    for i, (task, completed) in enumerate(tasks, 1):
        status = "[x]" if completed else "[ ]"
        print(f"{i}. {status} {task}")

def complete_task(task_number):
    """Mark a task as complete."""
    try:
        task_num = int(task_number)
    except ValueError:
        print("Error: Please enter a valid task number")
        return
    
    tasks = load_tasks()
    
    if task_num < 1 or task_num > len(tasks):
        print(f"Error: Task number must be between 1 and {len(tasks)}")
        return
    
    task_text, _ = tasks[task_num - 1]
    tasks[task_num - 1] = (task_text, True)
    save_tasks(tasks)
    print(f"Completed task {task_num}: {task_text}")

def show_help():
    """Display help information."""
    print("Todo App Commands:")
    print("  add <task>     - Add a new task")
    print("  list           - Show all tasks")
    print("  complete <num> - Mark task as complete")
    print("  help           - Show this help")

def main():
    if len(sys.argv) < 2:
        show_help()
        return
    
    command = sys.argv[1].lower()
    
    if command == "add":
        if len(sys.argv) < 3:
            print("Error: Please provide a task description")
            return
        task_text = " ".join(sys.argv[2:])
        add_task(task_text)
    
    elif command == "list":
        list_tasks()
    
    elif command == "complete":
        if len(sys.argv) < 3:
            print("Error: Please provide a task number")
            return
        complete_task(sys.argv[2])
    
    elif command == "help":
        show_help()
    
    else:
        print(f"Error: Unknown command '{command}'")
        show_help()

if __name__ == "__main__":
    main()