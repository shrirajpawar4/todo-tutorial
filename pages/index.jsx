import { ConnectButton } from '@rainbow-me/rainbowkit';
//import type { NextPage } from 'next';
import { useState, useEffect, useCallback } from "react";
import { useAccount, useWalletClient } from 'wagmi'
import { getContract } from 'viem'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../src/contract'


const Home = () => {
  const [tasks, setTasks] = useState([]);
  const [input, setInput] = useState(null);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  let contract;
  if(walletClient){
     contract = getContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI, 
      walletClient
    })
    console.log(contract);
  }

  const getTasks = useCallback( async () => {
		try {
			let tasks = [];
			let tasks_count = await contract.read.count();
			console.log("TOTAL NUMBER OF TASKS ", tasks_count.toString());
			if (tasks_count) {
				tasks_count = +tasks_count;
				// Fetch tasks
				for (let i = 0; i < tasks_count; i++) {
					const task = await contract.tasks(i);
					if (task) {
						tasks.push(task);
					}
				}
			}
			// Set task in the state
			setTasks(tasks);
		} catch (err) {
			console.log(err);
		}
	}, [contract]);

  const addNewTask = async() => {
    try {
      const newTask = await contract.write.addTask([input])
      console.log(newTask)
      setTasks(prev => [...prev, [input, false]])
      setInput(null)
      let inputTaskElement = document.getElementById('input-task');
      if(inputTaskElement) {
        inputTaskElement.value = "";
    }
    } catch(err) {
      console.log(err)
    }
  }

  const completeTask = async(task) => {
    try {
      console.log(tasks)
      const taskIndex = tasks.findIndex(a => a[0] === task)
      console.log("index ", taskIndex)
      const completeTask = await contract.write.completeTask(taskIndex)
      console.log(completeTask)
      await completeTask.wait()
      const newTasks = tasks.filter(a => a[0] !== task)
      console.log(newTasks)
      setTasks(newTasks)
    } catch(err) {
      console.log(err)
    }
  }

  useEffect(() => {
		if (contract) {
			getTasks();
		}
	}, [contract, getTasks]);

  return (
		<div className="flex flex-col justify-center items-center bg-black text-white">
			<div className="flex items-center justify-between w-full px-4 py-2">
				<p className="text-xl text font-bold">Todo-List</p>
				{address && <ConnectButton />}
			</div>
			<div
				style={{ minHeight: "95vh" }}
				className="flex flex-col items-center justify-center gap-4 w-full"
			>
				<h1 className="text-6xl text-fuchsia-300 font-extrabold">Todo List</h1>
				{!address && <ConnectButton />}

        {/* Add Task */}
        <div className="flex flex-row items-center justify-center gap-4">
          <input id="input-task" onChange={(e) => setInput(e.target.value)} className="px-4 py-2 rounded-xl text-black" placeholder="Add a task..." />
          <button onClick={addNewTask} className="px-4 py-2 rounded-xl border border-purple-700 bg-purple-700 text-white font-bold transform hover:scale-105">Add Task</button>
        </div>

        {/* All Tasks */}
				<div className="flex items-center justify-center flex-col">
					{tasks.length > 0 &&
						tasks.map((taskItem, i) => {
							return (
								<div key={i}>
                  {/* Check if task is not completed */}
                  {
                    !taskItem[1] && (
                      <div className="flex items-center justify-between gap-3 py-2">
                        <p>{taskItem[0]}</p>
                        <button onClick={() => completeTask(taskItem[0])} className="px-2 rounded-xl bg-white text-black border border-blue-400 transform hover:scale-105">Complete</button>
                      </div>
                    )
                  }
								</div>
							);
						})}
				</div>
			</div>
		</div>
	);
};

export default Home;
