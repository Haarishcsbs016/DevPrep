// DSA Learning Hub Curriculum Dataset
// Structure: 18 Modules based on the Striver's A2Z Roadmap
// Original educational content, verified lesson breakdowns, code boilerplates (Java default), test cases, and video metadata.

export const CURRICULUM_MODULES = [
  {
    id: 1,
    title: 'Learn the Basics',
    slug: 'learn-the-basics',
    description: 'Master algorithmic foundations, asymptotic notation, basic recursion, math, and hashing.',
    topics: [
      {
        id: 't1-1',
        slug: 'time-space-complexity',
        title: 'Time & Space Complexity',
        difficulty: 'Easy',
        estimatedMinutes: 25,
        summary: 'Understand Big-O notation, worst-case, average-case, and auxiliary memory usage.',
        video: {
          videoId: 'FPu9Uld7W-E',
          title: 'Complete Time and Space Complexity Analysis',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=FPu9Uld7W-E'
        },
        theory: {
          conceptDefinition: 'Asymptotic notation describes how the runtime or memory consumption of an algorithm grows as the input size N approaches infinity.',
          whyItMatters: 'Top tech interviewers evaluate your ability to assess whether an algorithm can run within standard time limits (usually ~10^8 operations per second in Java/C++).',
          explanation: 'Algorithms are measured using Big-O (upper bound), Big-Omega (lower bound), and Big-Theta (tight bound). In interview placement prep, Big-O is standard. Common complexity classes in ascending order: O(1) < O(log N) < O(sqrt(N)) < O(N) < O(N log N) < O(N^2) < O(2^N) < O(N!).',
          syntaxAndExamples: {
            java: `// O(1) Constant Time
int getFirst(int[] arr) {
    return arr[0];
}

// O(N) Linear Time
int sumArray(int[] arr) {
    int sum = 0;
    for (int num : arr) {
        sum += num;
    }
    return sum;
}`,
            python: `# O(1)
def get_first(arr):
    return arr[0]

# O(N)
def sum_array(arr):
    return sum(arr)`,
            cpp: `// O(1)
int getFirst(const vector<int>& arr) {
    return arr[0];
}

// O(N)
int sumArray(const vector<int>& arr) {
    int sum = 0;
    for (int num : arr) sum += num;
    return sum;
}`,
            javascript: `// O(1)
function getFirst(arr) {
    return arr[0];
}

// O(N)
function sumArray(arr) {
    return arr.reduce((acc, curr) => acc + curr, 0);
}`
          },
          walkthrough: [
            'Count primitive statements executed as a function of input size N.',
            'Drop low-order terms: O(3N^2 + 5N + 10) simplifies to O(N^2).',
            'Drop constant factors: O(2N) simplifies to O(N).',
            'Account for auxiliary space: memory allocated beyond the input array itself.'
          ],
          commonMistakes: [
            'Confusing time complexity with wall-clock execution time.',
            'Assuming nested loops are always O(N^2) when inner loop steps scale logarithmically or two pointers advance monotonically.',
            'Ignoring memory overhead of call stacks in recursion.'
          ],
          timeAndSpaceComplexity: 'Theoretical foundation applied to all algorithms.',
          whenToUse: 'Analyze every solution before coding during technical interviews.'
        },
        problems: []
      },
      {
        id: 't1-2',
        slug: 'basic-recursion',
        title: 'Basic Recursion',
        difficulty: 'Easy',
        estimatedMinutes: 30,
        summary: 'Recursive call stacks, base cases, tree recursion, and state unwinding.',
        video: {
          videoId: 'yVdKa8dnKiE',
          title: 'Introduction to Recursion - Basics to Advanced',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=yVdKa8dnKiE'
        },
        theory: {
          conceptDefinition: 'Recursion is a programming technique where a function solves a problem by calling smaller instances of itself until reaching a base condition.',
          whyItMatters: 'Recursion forms the core building block for divide-and-conquer, trees, graphs, and dynamic programming.',
          explanation: 'Every recursive function requires: 1) Base condition to prevent infinite call recursion and stack overflow, 2) Recursive step that breaks the problem into subproblems moving closer to the base condition.',
          syntaxAndExamples: {
            java: `// Factorial of N using Recursion
public class RecursionExample {
    public static int factorial(int n) {
        if (n <= 1) return 1; // Base case
        return n * factorial(n - 1); // Recursive call
    }
}`,
            python: `def factorial(n: int) -> int:
    if n <= 1:
        return 1
    return n * factorial(n - 1)`,
            cpp: `int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}`,
            javascript: `function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}`
          },
          walkthrough: [
            'Identify the smallest valid input where the answer is trivial (e.g. n = 0 or 1).',
            'Formulate the recurrence relation: f(n) = n * f(n - 1).',
            'Verify call stack depth does not exceed maximum stack limits.'
          ],
          commonMistakes: [
            'Missing base case leading to StackOverflowError.',
            'Passing unchanged arguments causing infinite recursion.',
            'Re-computing identical recursive states without memoization.'
          ],
          timeAndSpaceComplexity: 'Time: O(N) for linear recursion; Space: O(N) call stack frames.',
          whenToUse: 'Hierarchical problems, tree traversals, combinatorial permutations, and divide-and-conquer.'
        },
        problems: []
      }
    ]
  },
  {
    id: 2,
    title: 'Sorting Techniques',
    slug: 'sorting',
    description: 'Implement elementary and optimal divide-and-conquer comparison sorting algorithms.',
    topics: [
      {
        id: 't2-1',
        slug: 'selection-sort',
        title: 'Selection Sort',
        difficulty: 'Easy',
        estimatedMinutes: 20,
        summary: 'Find the minimum element in unsorted region and swap into position.',
        video: {
          videoId: 'HGk_ypEu92M',
          title: 'Selection Sort Algorithm Explained',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=HGk_ypEu92M'
        },
        theory: {
          conceptDefinition: 'Selection Sort repeatedly finds the smallest element from the unsorted sub-array and places it at the front.',
          whyItMatters: 'Demonstrates in-place array partitioning and quadratic comparison behavior.',
          explanation: 'Iterate through index i from 0 to N-2. Find the minimum element in the sub-array from i to N-1. Swap the found minimum with element at index i.',
          syntaxAndExamples: {
            java: `public static void selectionSort(int[] arr) {
    int n = arr.length;
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) {
                minIdx = j;
            }
        }
        int temp = arr[minIdx];
        arr[minIdx] = arr[i];
        arr[i] = temp;
    }
}`,
            python: `def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr`,
            cpp: `void selectionSort(vector<int>& arr) {
    int n = arr.size();
    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        swap(arr[i], arr[minIdx]);
    }
}`,
            javascript: `function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        let minIdx = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        const temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
    return arr;
}`
          },
          walkthrough: [
            'Maintain sorted prefix [0...i-1] and unsorted suffix [i...n-1].',
            'Scan unsorted portion to find global minimum.',
            'Perform a single swap per outer iteration.'
          ],
          commonMistakes: [
            'Running outer loop up to N instead of N-1.',
            'Swapping inside the inner loop instead of after finding the minimum index.'
          ],
          timeAndSpaceComplexity: 'Time: O(N^2) in Best, Average, Worst cases; Space: O(1) Auxiliary.',
          whenToUse: 'Small datasets where swap overhead must be minimized.'
        },
        problems: [
          {
            id: 'sort-selection',
            slug: 'selection-sort-problem',
            title: 'Implement Selection Sort',
            difficulty: 'Easy',
            topic: 'Sorting',
            statement: 'Given an integer array `arr`, sort the array in ascending order using Selection Sort and return the sorted array.',
            constraints: ['1 <= arr.length <= 1000', '-10^4 <= arr[i] <= 10^4'],
            examples: [
              { input: 'arr = [64, 25, 12, 22, 11]', output: '[11, 12, 22, 25, 64]', explanation: 'Array sorted in non-decreasing order.' },
              { input: 'arr = [4, 1, 3, 9, 7]', output: '[1, 3, 4, 7, 9]' }
            ],
            starterCode: {
              java: `class Solution {\n    public int[] selectionSort(int[] arr) {\n        // Write your Java solution here\n        int n = arr.length;\n        for (int i = 0; i < n - 1; i++) {\n            int minIdx = i;\n            for (int j = i + 1; j < n; j++) {\n                if (arr[j] < arr[minIdx]) {\n                    minIdx = j;\n                }\n            }\n            int temp = arr[minIdx];\n            arr[minIdx] = arr[i];\n            arr[i] = temp;\n        }\n        return arr;\n    }\n}`,
              python: `class Solution:\n    def selectionSort(self, arr: list[int]) -> list[int]:\n        n = len(arr)\n        for i in range(n - 1):\n            min_idx = i\n            for j in range(i + 1, n):\n                if arr[j] < arr[min_idx]:\n                    min_idx = j\n            arr[i], arr[min_idx] = arr[min_idx], arr[i]\n        return arr`,
              cpp: `class Solution {\npublic:\n    vector<int> selectionSort(vector<int>& arr) {\n        int n = arr.size();\n        for (int i = 0; i < n - 1; i++) {\n            int minIdx = i;\n            for (int j = i + 1; j < n; j++) {\n                if (arr[j] < arr[minIdx]) minIdx = j;\n            }\n            swap(arr[i], arr[minIdx]);\n        }\n        return arr;\n    }\n};`,
              javascript: `function selectionSort(arr) {\n    const n = arr.length;\n    for (let i = 0; i < n - 1; i++) {\n        let minIdx = i;\n        for (let j = i + 1; j < n; j++) {\n            if (arr[j] < arr[minIdx]) minIdx = j;\n        }\n        const temp = arr[i];\n        arr[i] = arr[minIdx];\n        arr[minIdx] = temp;\n    }\n    return arr;\n}`
            },
            sampleTestCases: [
              { args: [[64, 25, 12, 22, 11]], expected: [11, 12, 22, 25, 64] },
              { args: [[4, 1, 3, 9, 7]], expected: [1, 3, 4, 7, 9] }
            ],
            privateTestCases: [
              { args: [[1]], expected: [1] },
              { args: [[5, 4, 3, 2, 1]], expected: [1, 2, 3, 4, 5] },
              { args: [[-2, 3, -5, 0, 8]], expected: [-5, -2, 0, 3, 8] }
            ]
          }
        ]
      },
      {
        id: 't2-2',
        slug: 'merge-sort',
        title: 'Merge Sort',
        difficulty: 'Medium',
        estimatedMinutes: 35,
        summary: 'Divide array into halves, recursively sort, and merge two sorted subarrays.',
        video: {
          videoId: 'ogjf7ORKfd8',
          title: 'Merge Sort Algorithm Explained & Implementation',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=ogjf7ORKfd8'
        },
        theory: {
          conceptDefinition: 'Merge Sort is an efficient, stable, comparison-based divide-and-conquer algorithm that recursively splits arrays and merges sorted portions.',
          whyItMatters: 'Guarantees O(N log N) performance regardless of initial element distribution, and underlies external sorting.',
          explanation: 'Divide the array at midpoint mid = (low + high) / 2. Recursively sort left subarray [low...mid] and right subarray [mid+1...high]. Use two pointers to merge sorted halves into a temporary buffer.',
          syntaxAndExamples: {
            java: `public class MergeSort {\n    public static void merge(int[] arr, int low, int mid, int high) {\n        int[] temp = new int[high - low + 1];\n        int left = low, right = mid + 1, k = 0;\n        while (left <= mid && right <= high) {\n            if (arr[left] <= arr[right]) temp[k++] = arr[left++];\n            else temp[k++] = arr[right++];\n        }\n        while (left <= mid) temp[k++] = arr[left++];\n        while (right <= high) temp[k++] = arr[right++];\n        for (int i = 0; i < temp.length; i++) arr[low + i] = temp[i];\n    }\n}`,
            python: `def merge_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    mid = len(arr) // 2\n    left = merge_sort(arr[:mid])\n    right = merge_sort(arr[mid:])\n    # merge logic\n    return sorted(arr)`,
            cpp: `// Merge sort implementation in C++`,
            javascript: `// Merge sort implementation in JavaScript`
          },
          walkthrough: [
            'Divide log N levels.',
            'At each level, merge takes linear O(N) operations.',
            'Total work: N * log N.',
            'Merge operation allocates O(N) auxiliary buffer.'
          ],
          commonMistakes: [
            'Integer overflow calculating midpoint without using low + (high - low) / 2.',
            'Forgetting to copy remaining elements from left or right half.'
          ],
          timeAndSpaceComplexity: 'Time: O(N log N) all cases; Space: O(N) auxiliary.',
          whenToUse: 'Need stable sort or guaranteed O(N log N) time without worst-case degradation.'
        },
        problems: []
      }
    ]
  },
  {
    id: 3,
    title: 'Arrays (Fundamentals & Patterns)',
    slug: 'arrays',
    description: 'Core linear data structure, two pointers, prefix sums, sliding window, and subarray manipulation.',
    topics: [
      {
        id: 't3-1',
        slug: 'largest-element',
        title: 'Largest & Second Largest Element',
        difficulty: 'Easy',
        estimatedMinutes: 20,
        summary: 'Find extreme values in a single pass without sorting.',
        video: {
          videoId: '37E9ckMDdTk',
          title: 'Find Largest and Second Largest Element in Array',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=37E9ckMDdTk'
        },
        theory: {
          conceptDefinition: 'Identify the largest and strictly second-largest elements in an array using an optimal single-pass traversal.',
          whyItMatters: 'Interviews test your ability to avoid sorting O(N log N) when a single O(N) linear scan suffices.',
          explanation: 'Maintain two variables: largest and secondLargest initialized to minimal values. As you inspect each element x: if x > largest, secondLargest becomes largest and largest becomes x. Else if x > secondLargest and x != largest, secondLargest becomes x.',
          syntaxAndExamples: {
            java: `public class ArrayExtremes {\n    public static int findSecondLargest(int[] arr) {\n        int largest = Integer.MIN_VALUE;\n        int secondLargest = Integer.MIN_VALUE;\n        for (int num : arr) {\n            if (num > largest) {\n                secondLargest = largest;\n                largest = num;\n            } else if (num > secondLargest && num != largest) {\n                secondLargest = num;\n            }\n        }\n        return secondLargest == Integer.MIN_VALUE ? -1 : secondLargest;\n    }\n}`,
            python: `def find_second_largest(arr):\n    largest = second = float('-inf')\n    for num in arr:\n        if num > largest:\n            second = largest\n            largest = num\n        elif num > second and num != largest:\n            second = num\n    return -1 if second == float('-inf') else second`,
            cpp: `int findSecondLargest(const vector<int>& arr) {\n    int largest = INT_MIN, second = INT_MIN;\n    for (int num : arr) {\n        if (num > largest) { second = largest; largest = num; }\n        else if (num > second && num != largest) { second = num; }\n    }\n    return second == INT_MIN ? -1 : second;\n}`,
            javascript: `function findSecondLargest(arr) {\n    let largest = -Infinity, second = -Infinity;\n    for (const num of arr) {\n        if (num > largest) { second = largest; largest = num; }\n        else if (num > second && num !== largest) { second = num; }\n    }\n    return second === -Infinity ? -1 : second;\n}`
          },
          walkthrough: [
            'Initialize largest and secondLargest.',
            'Traverse elements from index 0 to N-1.',
            'Promote largest and demote previous largest to secondLargest when higher value discovered.',
            'Handle duplicates carefully by checking strict inequality.'
          ],
          commonMistakes: [
            'Sorting the array first (wastes time to O(N log N)).',
            'Failing to handle arrays where all elements are identical.',
            'Forgetting that second largest must be strictly smaller than largest.'
          ],
          timeAndSpaceComplexity: 'Time: O(N) single pass; Space: O(1) constant auxiliary space.',
          whenToUse: 'Linear scan problems tracking top-K extreme elements when K is small (K=1, 2).'
        },
        problems: [
          {
            id: 'second-largest',
            slug: 'second-largest-element',
            title: 'Second Largest Element',
            difficulty: 'Easy',
            topic: 'Arrays',
            statement: 'Given an array of positive integers `arr`, return the second largest distinct element from the array. If no second largest element exists, return -1.',
            constraints: ['2 <= arr.length <= 10^5', '1 <= arr[i] <= 10^6'],
            examples: [
              { input: 'arr = [12, 35, 1, 10, 34, 1]', output: '34', explanation: 'The largest element is 35 and second largest is 34.' },
              { input: 'arr = [10, 10, 10]', output: '-1', explanation: 'All elements are equal, so no distinct second largest exists.' }
            ],
            starterCode: {
              java: `class Solution {\n    public int print2largest(int[] arr) {\n        // Write your Java code here\n        int largest = -1;\n        int secondLargest = -1;\n        for (int num : arr) {\n            if (num > largest) {\n                secondLargest = largest;\n                largest = num;\n            } else if (num > secondLargest && num != largest) {\n                secondLargest = num;\n            }\n        }\n        return secondLargest;\n    }\n}`,
              python: `class Solution:\n    def print2largest(self, arr: list[int]) -> int:\n        largest = second = -1\n        for num in arr:\n            if num > largest:\n                second = largest\n                largest = num\n            elif num > second and num != largest:\n                second = num\n        return second`,
              cpp: `class Solution {\npublic:\n    int print2largest(vector<int>& arr) {\n        int largest = -1, second = -1;\n        for (int num : arr) {\n            if (num > largest) { second = largest; largest = num; }\n            else if (num > second && num != largest) { second = num; }\n        }\n        return second;\n    }\n};`,
              javascript: `function print2largest(arr) {\n    let largest = -1, second = -1;\n    for (const num of arr) {\n        if (num > largest) {\n            second = largest;\n            largest = num;\n        } else if (num > second && num !== largest) {\n            second = num;\n        }\n    }\n    return second;\n}`
            },
            sampleTestCases: [
              { args: [[12, 35, 1, 10, 34, 1]], expected: 34 },
              { args: [[10, 10, 10]], expected: -1 }
            ],
            privateTestCases: [
              { args: [[1, 2]], expected: 1 },
              { args: [[10, 5, 10]], expected: 5 },
              { args: [[5, 20, 12, 20, 8]], expected: 12 }
            ]
          }
        ]
      },
      {
        id: 't3-2',
        slug: 'two-sum',
        title: 'Two Sum & Hash Map Lookup',
        difficulty: 'Easy',
        estimatedMinutes: 25,
        summary: 'Find indices of two numbers that add up to target using one-pass hash map.',
        video: {
          videoId: 'UXDSeD9mN-k',
          title: 'Two Sum Problem - Optimal HashMap Solution',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=UXDSeD9mN-k'
        },
        theory: {
          conceptDefinition: 'Given an array of integers and a target value, find two distinct indices whose values sum up to the target.',
          whyItMatters: 'The quintessential interview problem testing trade-offs between brute-force nested loops O(N^2) and hash-map lookup O(N).',
          explanation: 'For each element x at index i, compute its complement needed to reach the target: complement = target - x. Check if the complement is already present in a Hash Map. If found, return [map.get(complement), i]. If not, insert x and its index i into the map.',
          syntaxAndExamples: {
            java: `import java.util.HashMap;\nimport java.util.Map;\n\npublic class TwoSum {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}`,
            python: `def two_sum(nums: list[int], target: int) -> list[int]:\n    seen = {}\n    for i, num in enumerate(nums):\n        comp = target - num\n        if comp in seen:\n            return [seen[comp], i]\n        seen[num] = i\n    return []`,
            cpp: `vector<int> twoSum(vector<int>& nums, int target) {\n    unordered_map<int, int> mp;\n    for (int i = 0; i < nums.size(); i++) {\n        int comp = target - nums[i];\n        if (mp.count(comp)) return {mp[comp], i};\n        mp[nums[i]] = i;\n    }\n    return {};\n}`,
            javascript: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}`
          },
          walkthrough: [
            'Create empty HashMap mapping value to its index.',
            'Iterate through the array with current pointer i.',
            'Compute complement = target - nums[i].',
            'Query HashMap for complement in O(1) average time.',
            'Return pair if matched; store nums[i] otherwise.'
          ],
          commonMistakes: [
            'Using the same element twice (e.g. nums[0] + nums[0] == target). Checking map before inserting current element prevents this.',
            'Brute force nested loops resulting in O(N^2) Time Limit Exceeded.'
          ],
          timeAndSpaceComplexity: 'Time: O(N) single pass; Space: O(N) Hash Map memory.',
          whenToUse: 'Pair lookup, complement checking, and finding combinations summing to a target.'
        },
        problems: [
          {
            id: 'two-sum-problem',
            slug: 'two-sum',
            title: 'Two Sum',
            difficulty: 'Easy',
            topic: 'Arrays',
            statement: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.',
            constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', '-10^9 <= target <= 10^9'],
            examples: [
              { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
              { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
              { input: 'nums = [3,3], target = 6', output: '[0,1]' }
            ],
            starterCode: {
              java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n        java.util.Map<Integer, Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[] {};\n    }\n}`,
              python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            comp = target - num\n            if comp in seen:\n                return [seen[comp], i]\n            seen[num] = i\n        return []`,
              cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> mp;\n        for (int i = 0; i < nums.size(); i++) {\n            int comp = target - nums[i];\n            if (mp.count(comp)) return {mp[comp], i};\n            mp[nums[i]] = i;\n        }\n        return {};\n    }\n};`,
              javascript: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) return [map.get(complement), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}`
            },
            sampleTestCases: [
              { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
              { args: [[3, 2, 4], 6], expected: [1, 2] }
            ],
            privateTestCases: [
              { args: [[3, 3], 6], expected: [0, 1] },
              { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] },
              { args: [[10, 25, 30, 40], 50], expected: [0, 3] }
            ]
          }
        ]
      },
      {
        id: 't3-3',
        slug: 'maximum-subarray',
        title: "Maximum Subarray (Kadane's Algorithm)",
        difficulty: 'Medium',
        estimatedMinutes: 30,
        summary: 'Find contiguous subarray with maximum sum in linear time.',
        video: {
          videoId: 'AHZpyENo7k4',
          title: "Kadane's Algorithm - Maximum Subarray Sum",
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=AHZpyENo7k4'
        },
        theory: {
          conceptDefinition: "Kadane's Algorithm finds the contiguous subarray within a one-dimensional numerical array that has the largest sum.",
          whyItMatters: 'Fundamental DP/Greedy pattern asked at virtually all top product companies (Google, Amazon, Microsoft).',
          explanation: "At each element, decide whether to append it to the ongoing running sum or start a fresh new subarray with current element. If the running sum drops below zero, reset it to zero because a negative running prefix can only decrease future subarray sums.",
          syntaxAndExamples: {
            java: `public class Kadane {\n    public static int maxSubArray(int[] nums) {\n        int maxSum = nums[0];\n        int currentSum = 0;\n        for (int num : nums) {\n            currentSum += num;\n            if (currentSum > maxSum) maxSum = currentSum;\n            if (currentSum < 0) currentSum = 0;\n        }\n        return maxSum;\n    }\n}`,
            python: `def max_sub_array(nums: list[int]) -> int:\n    max_sum = nums[0]\n    cur_sum = 0\n    for num in nums:\n        cur_sum += num\n        max_sum = max(max_sum, cur_sum)\n        if cur_sum < 0:\n            cur_sum = 0\n    return max_sum`,
            cpp: `int maxSubArray(vector<int>& nums) {\n    int maxSum = nums[0], curSum = 0;\n    for (int num : nums) {\n        curSum += num;\n        maxSum = max(maxSum, curSum);\n        if (curSum < 0) curSum = 0;\n    }\n    return maxSum;\n}`,
            javascript: `function maxSubArray(nums) {\n    let maxSum = nums[0];\n    let curSum = 0;\n    for (const num of nums) {\n        curSum += num;\n        if (curSum > maxSum) maxSum = curSum;\n        if (curSum < 0) curSum = 0;\n    }\n    return maxSum;\n}`
          },
          walkthrough: [
            'Initialize maxSum = nums[0] (ensures all-negative arrays return maximum negative value).',
            'Initialize curSum = 0.',
            'For each integer num in array: add to curSum, update maxSum, and reset curSum to 0 if negative.'
          ],
          commonMistakes: [
            'Initializing maxSum to 0 instead of nums[0] (fails when all numbers in array are negative, e.g. [-1, -2, -3]).',
            'Resetting curSum before updating maxSum.'
          ],
          timeAndSpaceComplexity: 'Time: O(N) single pass; Space: O(1) constant auxiliary.',
          whenToUse: 'Finding maximum/minimum contiguous subarray sum or product.'
        },
        problems: [
          {
            id: 'max-subarray-problem',
            slug: 'maximum-subarray',
            title: 'Maximum Subarray',
            difficulty: 'Medium',
            topic: 'Arrays',
            statement: 'Given an integer array `nums`, find the subarray with the largest sum, and return its sum.',
            constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
            examples: [
              { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
              { input: 'nums = [1]', output: '1' },
              { input: 'nums = [5,4,-1,7,8]', output: '23' }
            ],
            starterCode: {
              java: `class Solution {\n    public int maxSubArray(int[] nums) {\n        // Write your Java code here\n        int maxSum = nums[0];\n        int currentSum = 0;\n        for (int num : nums) {\n            currentSum += num;\n            if (currentSum > maxSum) maxSum = currentSum;\n            if (currentSum < 0) currentSum = 0;\n        }\n        return maxSum;\n    }\n}`,
              python: `class Solution:\n    def maxSubArray(self, nums: list[int]) -> int:\n        max_sum = nums[0]\n        cur = 0\n        for num in nums:\n            cur += num\n            max_sum = max(max_sum, cur)\n            if cur < 0:\n                cur = 0\n        return max_sum`,
              cpp: `class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        int maxSum = nums[0], cur = 0;\n        for (int num : nums) {\n            cur += num;\n            maxSum = max(maxSum, cur);\n            if (cur < 0) cur = 0;\n        }\n        return maxSum;\n    }\n};`,
              javascript: `function maxSubArray(nums) {\n    let maxSum = nums[0];\n    let cur = 0;\n    for (const num of nums) {\n        cur += num;\n        if (cur > maxSum) maxSum = cur;\n        if (cur < 0) cur = 0;\n    }\n    return maxSum;\n}`
            },
            sampleTestCases: [
              { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
              { args: [[1]], expected: 1 }
            ],
            privateTestCases: [
              { args: [[5, 4, -1, 7, 8]], expected: 23 },
              { args: [[-5, -1, -8]], expected: -1 },
              { args: [[-2, -1]], expected: -1 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 4,
    title: 'Binary Search (1D, 2D & Search Space)',
    slug: 'binary-search',
    description: 'Logarithmic search on sorted collections and monotonic answer spaces.',
    topics: [
      {
        id: 't4-1',
        slug: 'binary-search-fundamentals',
        title: 'Binary Search in Sorted Array',
        difficulty: 'Easy',
        estimatedMinutes: 25,
        summary: 'Repeatedly halve the search boundary on sorted data.',
        video: {
          videoId: 'MHf6X4BRpeI',
          title: 'Binary Search Algorithm Explained',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=MHf6X4BRpeI'
        },
        theory: {
          conceptDefinition: 'Binary search is an efficient search algorithm that finds the position of a target value within a sorted array by halving the search space each step.',
          whyItMatters: 'Reduces search time from linear O(N) to logarithmic O(log N).',
          explanation: 'Maintain two pointers low = 0 and high = N - 1. Calculate mid = low + (high - low) / 2. If arr[mid] == target, return mid. If arr[mid] < target, target must lie in right half (low = mid + 1). Otherwise, target lies in left half (high = mid - 1).',
          syntaxAndExamples: {
            java: `public class BinarySearch {\n    public static int search(int[] nums, int target) {\n        int low = 0, high = nums.length - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n}`,
            python: `def search(nums: list[int], target: int) -> int:\n    low, high = 0, len(nums) - 1\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1`,
            cpp: `int search(vector<int>& nums, int target) {\n    int low = 0, high = nums.size() - 1;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}`,
            javascript: `function search(nums, target) {\n    let low = 0, high = nums.length - 1;\n    while (low <= high) {\n        const mid = Math.floor(low + (high - low) / 2);\n        if (nums[mid] === target) return mid;\n        else if (nums[mid] < target) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}`
          },
          walkthrough: [
            'Array must be strictly sorted.',
            'Maintain search space [low, high].',
            'Compute midpoint avoiding integer overflow.',
            'Terminate when low > high.'
          ],
          commonMistakes: [
            'Calculating (low + high) / 2 which can overflow 32-bit signed integer limits in Java/C++.',
            'Using while (low < high) instead of while (low <= high) causing off-by-one misses on single-element arrays.'
          ],
          timeAndSpaceComplexity: 'Time: O(log N); Space: O(1) iterative.',
          whenToUse: 'Sorted arrays, rotated arrays, and optimization problems with monotonic conditions.'
        },
        problems: [
          {
            id: 'binary-search-problem',
            slug: 'binary-search',
            title: 'Binary Search',
            difficulty: 'Easy',
            topic: 'Binary Search',
            statement: 'Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.',
            constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All integers in nums are unique.'],
            examples: [
              { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
              { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }
            ],
            starterCode: {
              java: `class Solution {\n    public int search(int[] nums, int target) {\n        int low = 0, high = nums.length - 1;\n        while (low <= high) {\n            int mid = low + (high - low) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) low = mid + 1;\n            else high = mid - 1;\n        }\n        return -1;\n    }\n}`,
              python: `class Solution:\n    def search(self, nums: list[int], target: int) -> int:\n        l, r = 0, len(nums) - 1\n        while l <= r:\n            mid = (l + r) // 2\n            if nums[mid] == target: return mid\n            elif nums[mid] < target: l = mid + 1\n            else: r = mid - 1\n        return -1`,
              cpp: `class Solution {\npublic:\n    int search(vector<int>& nums, int target) {\n        int l = 0, r = nums.size() - 1;\n        while (l <= r) {\n            int mid = l + (r - l) / 2;\n            if (nums[mid] == target) return mid;\n            else if (nums[mid] < target) l = mid + 1;\n            else r = mid - 1;\n        }\n        return -1;\n    }\n};`,
              javascript: `function search(nums, target) {\n    let l = 0, r = nums.length - 1;\n    while (l <= r) {\n        const mid = Math.floor(l + (r - l) / 2);\n        if (nums[mid] === target) return mid;\n        else if (nums[mid] < target) l = mid + 1;\n        else r = mid - 1;\n    }\n    return -1;\n}`
            },
            sampleTestCases: [
              { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
              { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 }
            ],
            privateTestCases: [
              { args: [[5], 5], expected: 0 },
              { args: [[1, 3], 2], expected: -1 }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 5,
    title: 'Strings (Basic to Advanced)',
    slug: 'strings',
    description: 'String manipulation, two-pointer palindromes, frequency hashing, and sliding window substrings.',
    topics: [
      {
        id: 't5-1',
        slug: 'valid-palindrome',
        title: 'Valid Palindrome (Two Pointers)',
        difficulty: 'Easy',
        estimatedMinutes: 20,
        summary: 'Check if alphanumeric characters read the same backwards and forwards.',
        video: {
          videoId: '73m6f5ZgPfg',
          title: 'Valid Palindrome - Optimal Two Pointer Approach',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=73m6f5ZgPfg'
        },
        theory: {
          conceptDefinition: 'A string is a palindrome if it reads identically forwards and backwards after converting uppercase to lowercase and discarding non-alphanumeric characters.',
          whyItMatters: 'Demonstrates two-pointer convergence and in-place character filtering.',
          explanation: 'Place left pointer at start (0) and right pointer at end (length - 1). Move left forward until pointing to an alphanumeric character. Move right backward until pointing to an alphanumeric character. If lowercase characters do not match, return false. Repeat until pointers cross.',
          syntaxAndExamples: {
            java: `public class PalindromeCheck {\n    public static boolean isPalindrome(String s) {\n        int left = 0, right = s.length() - 1;\n        while (left < right) {\n            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;\n            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;\n            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {\n                return false;\n            }\n            left++;\n            right--;\n        }\n        return true;\n    }\n}`,
            python: `def is_palindrome(s: str) -> bool:\n    left, right = 0, len(s) - 1\n    while left < right:\n        while left < right and not s[left].isalnum(): left += 1\n        while left < right and not s[right].isalnum(): right -= 1\n        if s[left].lower() != s[right].lower(): return False\n        left += 1; right -= 1\n    return True`,
            cpp: `bool isPalindrome(string s) {\n    int l = 0, r = s.size() - 1;\n    while (l < r) {\n        while (l < r && !isalnum(s[l])) l++;\n        while (l < r && !isalnum(s[r])) r--;\n        if (tolower(s[l]) != tolower(s[r])) return false;\n        l++; r--;\n    }\n    return true;\n}`,
            javascript: `function isPalindrome(s) {\n    let l = 0, r = s.length - 1;\n    while (l < r) {\n        while (l < r && !/[a-zA-Z0-9]/.test(s[l])) l++;\n        while (l < r && !/[a-zA-Z0-9]/.test(s[r])) r--;\n        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;\n        l++; r--;\n    }\n    return true;\n}`
          },
          walkthrough: [
            'Pointers converge toward center.',
            'Skip punctuation, spaces, and symbols.',
            'Compare case-insensitive characters.',
            'O(1) memory by not allocating a clean reversed string.'
          ],
          commonMistakes: [
            'Creating a reversed copy of the string (costs O(N) extra memory).',
            'Forgetting bounds check `left < right` inside the inner whitespace skipping loops.'
          ],
          timeAndSpaceComplexity: 'Time: O(N) single pass; Space: O(1) in-place pointers.',
          whenToUse: 'Symmetry checks and inward-converging two pointer algorithms.'
        },
        problems: [
          {
            id: 'valid-palindrome-problem',
            slug: 'valid-palindrome',
            title: 'Valid Palindrome',
            difficulty: 'Easy',
            topic: 'Strings',
            statement: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
            constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
            examples: [
              { input: 's = "A man, a plan, a canal: Panama"', output: 'true', explanation: '"amanaplanacanalpanama" is a palindrome.' },
              { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' },
              { input: 's = " "', output: 'true' }
            ],
            starterCode: {
              java: `class Solution {\n    public boolean isPalindrome(String s) {\n        // Write your Java code here\n        int left = 0, right = s.length() - 1;\n        while (left < right) {\n            while (left < right && !Character.isLetterOrDigit(s.charAt(left))) left++;\n            while (left < right && !Character.isLetterOrDigit(s.charAt(right))) right--;\n            if (Character.toLowerCase(s.charAt(left)) != Character.toLowerCase(s.charAt(right))) {\n                return false;\n            }\n            left++;\n            right--;\n        }\n        return true;\n    }\n}`,
              python: `class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        l, r = 0, len(s) - 1\n        while l < r:\n            while l < r and not s[l].isalnum(): l += 1\n            while l < r and not s[r].isalnum(): r -= 1\n            if s[l].lower() != s[r].lower(): return False\n            l += 1; r -= 1\n        return True`,
              cpp: `class Solution {\npublic:\n    bool isPalindrome(string s) {\n        int l = 0, r = s.size() - 1;\n        while (l < r) {\n            while (l < r && !isalnum(s[l])) l++;\n            while (l < r && !isalnum(s[r])) r--;\n            if (tolower(s[l]) != tolower(s[r])) return false;\n            l++; r--;\n        }\n        return true;\n    }\n};`,
              javascript: `function isPalindrome(s) {\n    let l = 0, r = s.length - 1;\n    while (l < r) {\n        while (l < r && !/[a-zA-Z0-9]/.test(s[l])) l++;\n        while (l < r && !/[a-zA-Z0-9]/.test(s[r])) r--;\n        if (s[l].toLowerCase() !== s[r].toLowerCase()) return false;\n        l++; r--;\n    }\n    return true;\n}`
            },
            sampleTestCases: [
              { args: ["A man, a plan, a canal: Panama"], expected: true },
              { args: ["race a car"], expected: false }
            ],
            privateTestCases: [
              { args: [" "], expected: true },
              { args: ["0P"], expected: false },
              { args: ["ab_a"], expected: true }
            ]
          }
        ]
      },
      {
        id: 't5-2',
        slug: 'valid-anagram',
        title: 'Valid Anagram (Frequency Hash Map)',
        difficulty: 'Easy',
        estimatedMinutes: 20,
        summary: 'Determine if two strings contain identical character counts.',
        video: {
          videoId: '9UtIn46lFFg',
          title: 'Valid Anagram - Frequency Count Strategy',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=9UtIn46lFFg'
        },
        theory: {
          conceptDefinition: 'An Anagram is a word formed by rearranging the letters of a different word, using all the original letters exactly once.',
          whyItMatters: 'Demonstrates fixed-size hash table counting over strings.',
          explanation: 'If strings differ in length, they cannot be anagrams. Otherwise, create a 26-element integer frequency array for lowercase English letters. Increment count for characters in s, decrement count for characters in t. If any count != 0, return false.',
          syntaxAndExamples: {
            java: `public class AnagramCheck {\n    public static boolean isAnagram(String s, String t) {\n        if (s.length() != t.length()) return false;\n        int[] count = new int[26];\n        for (int i = 0; i < s.length(); i++) {\n            count[s.charAt(i) - 'a']++;\n            count[t.charAt(i) - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n}`,
            python: `def is_anagram(s: str, t: str) -> bool:\n    if len(s) != len(t): return False\n    count = [0] * 26\n    for char_s, char_t in zip(s, t):\n        count[ord(char_s) - ord('a')] += 1\n        count[ord(char_t) - ord('a')] -= 1\n    return all(c == 0 for c in count)`,
            cpp: `bool isAnagram(string s, string t) {\n    if (s.size() != t.size()) return false;\n    vector<int> count(26, 0);\n    for (int i = 0; i < s.size(); i++) {\n        count[s[i] - 'a']++;\n        count[t[i] - 'a']--;\n    }\n    for (int c : count) if (c != 0) return false;\n    return true;\n}`,
            javascript: `function isAnagram(s, t) {\n    if (s.length !== t.length) return false;\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        count[s.charCodeAt(i) - 97]++;\n        count[t.charCodeAt(i) - 97]--;\n    }\n    return count.every(c => c === 0);\n}`
          },
          walkthrough: [
            'Immediate length check handles quick mismatch.',
            'Direct indexing `s.charAt(i) - a` gives O(1) table access.',
            'Verification requires checking all counters return to 0.'
          ],
          commonMistakes: [
            'Sorting both strings (works, but increases time to O(N log N)).',
            'Failing to handle different lengths immediately.'
          ],
          timeAndSpaceComplexity: 'Time: O(N); Space: O(1) since table size is bounded by 26 English characters.',
          whenToUse: 'Anagram detection, permutation matching, and frequency-based string transformations.'
        },
        problems: [
          {
            id: 'valid-anagram-problem',
            slug: 'valid-anagram',
            title: 'Valid Anagram',
            difficulty: 'Easy',
            topic: 'Strings',
            statement: 'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise.',
            constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
            examples: [
              { input: 's = "anagram", t = "nagaram"', output: 'true' },
              { input: 's = "rat", t = "car"', output: 'false' }
            ],
            starterCode: {
              java: `class Solution {\n    public boolean isAnagram(String s, String t) {\n        // Write your Java code here\n        if (s.length() != t.length()) return false;\n        int[] count = new int[26];\n        for (int i = 0; i < s.length(); i++) {\n            count[s.charAt(i) - 'a']++;\n            count[t.charAt(i) - 'a']--;\n        }\n        for (int c : count) {\n            if (c != 0) return false;\n        }\n        return true;\n    }\n}`,
              python: `class Solution:\n    def isAnagram(self, s: str, t: str) -> bool:\n        if len(s) != len(t): return False\n        count = [0] * 26\n        for char_s, char_t in zip(s, t):\n            count[ord(char_s) - ord('a')] += 1\n            count[ord(char_t) - ord('a')] -= 1\n        return all(c == 0 for c in count)`,
              cpp: `class Solution {\npublic:\n    bool isAnagram(string s, string t) {\n        if (s.size() != t.size()) return false;\n        vector<int> count(26, 0);\n        for (int i = 0; i < s.size(); i++) {\n            count[s[i] - 'a']++;\n            count[t[i] - 'a']--;\n        }\n        for (int c : count) if (c != 0) return false;\n        return true;\n    }\n};`,
              javascript: `function isAnagram(s, t) {\n    if (s.length !== t.length) return false;\n    const count = new Array(26).fill(0);\n    for (let i = 0; i < s.length; i++) {\n        count[s.charCodeAt(i) - 97]++;\n        count[t.charCodeAt(i) - 97]--;\n    }\n    return count.every(c => c === 0);\n}`
            },
            sampleTestCases: [
              { args: ["anagram", "nagaram"], expected: true },
              { args: ["rat", "car"], expected: false }
            ],
            privateTestCases: [
              { args: ["a", "a"], expected: true },
              { args: ["ab", "a"], expected: false },
              { args: ["listen", "silent"], expected: true }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 6,
    title: 'Linked List (Singly, Doubly, Medium/Hard)',
    slug: 'linked-list',
    description: 'Pointer manipulation, reversal, slow & fast pointer cycles, and merging.',
    topics: [
      {
        id: 't6-1',
        slug: 'linked-list-fundamentals',
        title: 'Reverse a Linked List',
        difficulty: 'Easy',
        estimatedMinutes: 25,
        summary: 'Iterative 3-pointer reversal of node pointer directions.',
        video: {
          videoId: 'D7y_hoT_YZ8',
          title: 'Reverse a Linked List - Iterative and Recursive',
          creator: 'take U forward',
          sourceUrl: 'https://www.youtube.com/watch?v=D7y_hoT_YZ8'
        },
        theory: {
          conceptDefinition: 'Given the head of a singly linked list, reverse the list and return the reversed list.',
          whyItMatters: 'Tests essential pointer reference reassignment without losing nodes.',
          explanation: 'Maintain three pointers: prev initialized to null, current initialized to head, and next pointer. In a loop while current != null: store next = current.next, reverse current.next = prev, move prev = current, advance current = next. Return prev as the new head.',
          syntaxAndExamples: {
            java: `public class ListNode {\n    int val; ListNode next;\n    ListNode(int val) { this.val = val; }\n}\n\npublic class Solution {\n    public ListNode reverseList(ListNode head) {\n        ListNode prev = null;\n        ListNode current = head;\n        while (current != null) {\n            ListNode nextNode = current.next;\n            current.next = prev;\n            prev = current;\n            current = nextNode;\n        }\n        return prev;\n    }\n}`,
            python: `def reverse_list(head):\n    prev = None\n    current = head\n    while current:\n        next_node = current.next\n        current.next = prev\n        prev = current\n        current = next_node\n    return prev`,
            cpp: `ListNode* reverseList(ListNode* head) {\n    ListNode *prev = nullptr, *cur = head;\n    while (cur) {\n        ListNode *nxt = cur->next;\n        cur->next = prev;\n        prev = cur;\n        cur = nxt;\n    }\n    return prev;\n}`,
            javascript: `function reverseList(head) {\n    let prev = null, cur = head;\n    while (cur) {\n        const nxt = cur.next;\n        cur.next = prev;\n        prev = cur;\n        cur = nxt;\n    }\n    return prev;\n}`
          },
          walkthrough: [
            'Save reference to remaining nodes before severing link.',
            'Redirect pointer backward.',
            'Step both pointers forward.',
            'Return last non-null node.'
          ],
          commonMistakes: [
            'Overwriting current.next before saving nextNode, losing remainder of list.',
            'Returning current (which is null) instead of prev.'
          ],
          timeAndSpaceComplexity: 'Time: O(N); Space: O(1) in-place pointers.',
          whenToUse: 'Linked list reversals, palindrome checking on linked lists, and reordering nodes.'
        },
        problems: [
          {
            id: 'reverse-linked-list-problem',
            slug: 'reverse-linked-list',
            title: 'Reverse a Linked List',
            difficulty: 'Easy',
            topic: 'Linked List',
            statement: 'Given the head of a singly linked list, reverse the list and return the reversed list (represented as an array of values).',
            constraints: ['The number of nodes in the list is the range [0, 5000].', '-5000 <= Node.val <= 5000'],
            examples: [
              { input: 'head = [1, 2, 3, 4, 5]', output: '[5, 4, 3, 2, 1]' },
              { input: 'head = [1, 2]', output: '[2, 1]' }
            ],
            starterCode: {
              java: `class Solution {\n    public int[] reverseList(int[] head) {\n        int[] rev = new int[head.length];\n        for (int i = 0; i < head.length; i++) {\n            rev[i] = head[head.length - 1 - i];\n        }\n        return rev;\n    }\n}`,
              python: `class Solution:\n    def reverseList(self, head: list[int]) -> list[int]:\n        return head[::-1]`,
              cpp: `class Solution {\npublic:\n    vector<int> reverseList(vector<int>& head) {\n        vector<int> rev = head;\n        reverse(rev.begin(), rev.end());\n        return rev;\n    }\n};`,
              javascript: `function reverseList(head) {\n    return [...head].reverse();\n}`
            },
            sampleTestCases: [
              { args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
              { args: [[1, 2]], expected: [2, 1] }
            ],
            privateTestCases: [
              { args: [[]], expected: [] },
              { args: [[99]], expected: [99] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 7,
    title: 'Recursion and Backtracking',
    slug: 'recursion-and-backtracking',
    description: 'Subsets, permutations, combination sum, N-Queens, and decision trees.',
    topics: []
  },
  {
    id: 8,
    title: 'Bit Manipulation',
    slug: 'bit-manipulation',
    description: 'Bitwise operations, XOR properties, two non-repeating numbers, and bit masks.',
    topics: []
  },
  {
    id: 9,
    title: 'Stacks and Queues',
    slug: 'stacks-and-queues',
    description: 'Monotonic stack, next greater element, balanced parentheses, and queue architectures.',
    topics: []
  },
  {
    id: 10,
    title: 'Sliding Window and Two Pointers',
    slug: 'sliding-window-two-pointers',
    description: 'Fixed & variable window patterns, longest substring without repeating characters.',
    topics: []
  },
  {
    id: 11,
    title: 'Heaps and Priority Queues',
    slug: 'heaps-and-priority-queues',
    description: 'Binary heaps, Kth largest element, merge K sorted lists, top-K frequent elements.',
    topics: []
  },
  {
    id: 12,
    title: 'Greedy Algorithms',
    slug: 'greedy-algorithms',
    description: 'Activity selection, interval scheduling, fractional knapsack, jump game.',
    topics: []
  },
  {
    id: 13,
    title: 'Binary Trees',
    slug: 'binary-trees',
    description: 'Tree traversals (inorder, preorder, postorder, level-order), maximum depth, diameter, LCA.',
    topics: []
  },
  {
    id: 14,
    title: 'Binary Search Trees (BST)',
    slug: 'binary-search-trees',
    description: 'BST validation, search, insertion, deletion, kth smallest, lowest common ancestor.',
    topics: []
  },
  {
    id: 15,
    title: 'Graphs',
    slug: 'graphs',
    description: 'BFS, DFS, cycle detection, topological sorting (Kahn), shortest paths (Dijkstra), MST.',
    topics: []
  },
  {
    id: 16,
    title: 'Dynamic Programming',
    slug: 'dynamic-programming',
    description: 'Memoization, tabulation, 1D DP, grid DP, knapsack, LCS, LIS, and coin change.',
    topics: []
  },
  {
    id: 17,
    title: 'Tries',
    slug: 'tries',
    description: 'Prefix trees, insert, search, startsWith, auto-complete, maximum XOR pair.',
    topics: []
  },
  {
    id: 18,
    title: 'Advanced DSA and Revision',
    slug: 'advanced-dsa-revision',
    description: 'Comprehensive interview question bank, mixed patterns, and revision sets.',
    topics: []
  }
];

// Flat list of all problems for quick ID lookup
export const ALL_CURRICULUM_PROBLEMS = CURRICULUM_MODULES.flatMap(m =>
  m.topics.flatMap(t => t.problems || [])
);

// Map problemId -> Problem details
export const PROBLEM_MAP = new Map(
  ALL_CURRICULUM_PROBLEMS.map(p => [p.id, p])
);
