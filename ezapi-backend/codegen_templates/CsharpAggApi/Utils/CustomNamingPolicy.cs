using System.Text;
using System.Text.Json;

namespace CNKTOPROJNMTMP.Utils
{
    public class CustomNamingPolicy : JsonNamingPolicy
    {
        public override string ConvertName(string name)
        {
            Console.WriteLine("name inside convertName.." + name);
            return ConvertSnakeCaseToCamelCase(name);
        }


        private string ConvertSnakeCaseToCamelCase(string name)
        {
            // Implement your logic to convert snake_case to camelCase
            // For example, using a StringBuilder:
           
            name = name.Replace(name[0], char.ToUpper(name[0]));
            if (name.Contains("_"))
            {
                int underscoreIndex = name.IndexOf("_");
                if (!char.IsUpper(name[underscoreIndex + 1]))
                {
                    char nextChar = char.ToUpper(name[underscoreIndex + 1]);
                    name = name.Remove(underscoreIndex, 2).Insert(underscoreIndex, nextChar.ToString());
                }
                if (name.Contains("_"))
                {
                    name = name.Remove(underscoreIndex, 1);
                }
            }

            return name;
            /*var stringBuilder = new StringBuilder();
            bool capitalizeNext = false;
            foreach (char c in name)
            {
                if (c == '_')
                {
                    capitalizeNext = true;
                }
                else
                {
                    stringBuilder.Append(capitalizeNext ? char.ToUpper(c) : c);
                    capitalizeNext = false;
                }
            }

            return stringBuilder.ToString();*/
        }
    }
}

