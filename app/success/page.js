export default function Success() {
       return (
         <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
           <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
             <h2 className="text-center text-3xl font-extrabold text-gray-900">Registration Successful</h2>
             <p className="text-center text-sm text-gray-600">
               Thank you for registering with our gym. We will contact you soon with further details.
             </p>
             <a
               href="/"
               className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             >
               Back to Home
             </a>
           </div>
         </div>
       );
     }